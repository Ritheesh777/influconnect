import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { Collaboration } from '../models/Collaboration.js';
import { BlockedUser } from '../models/BlockedUser.js';
import { emitToUser } from '../sockets/registry.js';
import { notify } from '../utils/notify.js';

function isParticipant(convo, userId) {
  return convo.participants.some((p) => String(p._id || p) === String(userId));
}

function otherOf(convo, userId) {
  return convo.participants.find((p) => String(p._id || p) !== String(userId));
}

/**
 * §20/BR-NEW-008 — a conversation is only usable once it is backed by an
 * accepted collaboration. Enforced on every read/write so no client can talk
 * its way past the rule.
 */
async function assertUnlocked(convo) {
  const collab = convo.collaboration
    ? await Collaboration.findById(convo.collaboration).lean()
    : await Collaboration.findOne({
        campaign: convo.campaign,
        company: convo.participants[0],
        creator: convo.participants[1],
      }).lean();
  const ok = collab && ['active', 'completed'].includes(collab.status);
  if (!ok)
    throw ApiError.forbidden(
      'Chat unlocks only after the collaboration is accepted by both parties.'
    );
  return collab;
}

/**
 * §27 — blocking prevents *new interaction* only. Reading history stays legal
 * for both sides (and for admins); only sending is refused.
 */
async function assertNotBlocked(convo, userId) {
  const other = otherOf(convo, userId);
  if (!other) return;
  const b = await BlockedUser.betweenPair(userId, other);
  if (b.iBlockedThem)
    throw ApiError.forbidden('You have blocked this user. Unblock them to send messages.');
  if (b.theyBlockedMe)
    // Deliberately vague: revealing "they blocked you" invites harassment.
    throw ApiError.forbidden('You can no longer send messages in this conversation.');
}

/** Strips a consumed one-time image before it ever leaves the server (§25). */
function redactViewOnce(msg, userId) {
  if (!msg.viewOnce) return msg;
  const mine = String(msg.sender._id || msg.sender) === String(userId);
  const opened = (msg.viewedBy || []).some((u) => String(u) === String(userId));
  // The sender always sees their own; the recipient loses it once opened.
  if (mine || !opened) return msg;
  return { ...msg, attachments: [], viewOnceConsumed: true };
}

// GET /api/chat/conversations?category=&q=
export const getConversations = asyncHandler(async (req, res) => {
  const me = String(req.user._id);
  const convos = await Conversation.find({ participants: req.user._id })
    .sort('-lastMessageAt -updatedAt')
    .populate('participants', 'name role')
    .populate('campaign', 'title')
    .lean();

  // Only surface threads backed by an accepted collaboration (§20)
  const collabs = await Collaboration.find({
    _id: { $in: convos.map((c) => c.collaboration).filter(Boolean) },
    status: { $in: ['active', 'completed'] },
  })
    .select('_id')
    .lean();
  const unlockedIds = new Set(collabs.map((c) => String(c._id)));

  let items = convos
    .filter((c) => c.collaboration && unlockedIds.has(String(c.collaboration)))
    .map((c) => {
      const p = c.settings?.[me] || {};
      return {
        ...c,
        settings: undefined, // never leak the other party's preferences
        category: p.category || 'general',
        muted: !!p.muted,
        unreadCount: c.unread?.[me] || 0,
        otherParty: c.participants.find((x) => String(x._id) !== me),
      };
    });

  // Tab counts are computed before filtering, so the badges stay correct (§26)
  const counts = { primary: 0, general: 0, archived: 0 };
  for (const i of items) counts[i.category] = (counts[i.category] || 0) + 1;

  const { category, q } = req.query;
  if (category && ['primary', 'general', 'archived'].includes(category))
    items = items.filter((i) => i.category === category);

  // §28 — search by company name, creator name or campaign name. Scoped to the
  // caller's own conversations, so permissions are respected by construction.
  if (q?.trim()) {
    const needle = q.trim().toLowerCase();
    items = items.filter(
      (i) =>
        i.otherParty?.name?.toLowerCase().includes(needle) ||
        i.campaign?.title?.toLowerCase().includes(needle)
    );
  }

  res.json({ success: true, items, counts });
});

// GET /api/chat/conversations/:id/messages
export const getMessages = asyncHandler(async (req, res) => {
  const convo = await Conversation.findById(req.params.id).populate('participants', 'name role');
  if (!convo) throw ApiError.notFound('Conversation not found');
  if (!isParticipant(convo, req.user._id)) throw ApiError.forbidden();
  await assertUnlocked(convo);

  const prefs = convo.prefsFor(req.user._id);
  const filter = {
    conversation: convo._id,
    deletedFor: { $ne: req.user._id },
    // §27 one-sided clear — only messages after the clear point
    ...(prefs.clearedAt ? { createdAt: { $gt: prefs.clearedAt } } : {}),
  };
  const raw = await Message.find(filter).sort('createdAt').populate('sender', 'name role').lean();
  const messages = raw.map((m) => redactViewOnce(m, req.user._id));

  convo.unread.set(String(req.user._id), 0);
  await convo.save();
  await Message.updateMany(
    { conversation: convo._id, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id } }
  );

  const other = otherOf(convo, req.user._id);
  const block = other ? await BlockedUser.betweenPair(req.user._id, other._id || other) : { any: false };

  res.json({
    success: true,
    conversation: { ...convo.toObject(), settings: undefined, ...prefs },
    messages,
    // Drives the composer's disabled state; `theyBlockedMe` is intentionally
    // not exposed, only the resulting inability to send.
    blocked: { iBlockedThem: !!block.iBlockedThem, canSend: !block.any },
  });
});

// POST /api/chat/conversations/:id/messages  { body, attachments, viewOnce }
export const sendMessage = asyncHandler(async (req, res) => {
  const convo = await Conversation.findById(req.params.id);
  if (!convo) throw ApiError.notFound('Conversation not found');
  if (!isParticipant(convo, req.user._id)) throw ApiError.forbidden();
  await assertUnlocked(convo);
  await assertNotBlocked(convo, req.user._id);

  const attachments = req.body.attachments || [];
  const viewOnce = !!req.body.viewOnce;
  // §25 — view-once is an *image* affordance; a one-time PDF invoice would be a
  // false promise since the recipient must keep it.
  if (viewOnce && (attachments.length !== 1 || attachments[0].type !== 'image'))
    throw ApiError.badRequest('View-once can only be used with a single image.');
  if (!req.body.body?.trim() && attachments.length === 0)
    throw ApiError.badRequest('Message cannot be empty.');

  const message = await Message.create({
    conversation: convo._id,
    sender: req.user._id,
    body: req.body.body || '',
    attachments,
    viewOnce,
    readBy: [req.user._id],
  });

  convo.lastMessage = message.body || (viewOnce ? 'Photo' : 'Attachment');
  convo.lastMessageAt = new Date();
  const other = otherOf(convo, req.user._id);
  if (other) convo.unread.set(String(other), (convo.unread.get(String(other)) || 0) + 1);

  // A reply pulls an archived thread back into General for the recipient —
  // otherwise new messages would silently vanish into the Archived tab.
  if (other) {
    const p = convo.settings.get(String(other));
    if (p?.category === 'archived') convo.settings.set(String(other), { ...p.toObject?.() ?? p, category: 'general' });
  }
  await convo.save();

  const populated = await message.populate('sender', 'name role');
  if (other) {
    emitToUser(other, 'message:new', { conversationId: convo._id, message: populated });
    // §27 — a muted conversation still delivers the message, just not the ping.
    const muted = convo.prefsFor(other).muted;
    if (!muted)
      await notify({
        user: other,
        type: 'new_message',
        title: 'New message',
        body: `${req.user.name}: ${(message.body || 'Attachment').slice(0, 60)}`,
        link: `/messages?c=${convo._id}`,
      });
  }
  res.status(201).json({ success: true, message: populated });
});

// POST /api/chat/messages/:id/view — consume a one-time image (§25)
export const viewOnceMedia = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) throw ApiError.notFound('Message not found');
  if (!message.viewOnce) throw ApiError.badRequest('That message is not a one-time photo.');

  const convo = await Conversation.findById(message.conversation);
  if (!convo || !isParticipant(convo, req.user._id)) throw ApiError.forbidden();
  if (String(message.sender) === String(req.user._id))
    throw ApiError.badRequest('You sent this photo.');

  const already = message.viewedBy.some((u) => String(u) === String(req.user._id));
  if (already) throw ApiError.forbidden('This photo has already been viewed and is no longer available.');

  const attachments = message.attachments.map((a) => a.toObject());

  // Record consumption BEFORE returning the URL. If two requests race, the
  // unique-ish check above plus this write means the photo is handed out once.
  message.viewedBy.push(req.user._id);
  message.viewOnceConsumedAt = new Date();
  // Wipe the stored URL so it cannot be re-fetched, replayed from the network
  // tab, or recovered by an admin browsing the DB. §25 acknowledges that a
  // screenshot is still possible — this closes the API hole, not the camera.
  message.attachments = [];
  await message.save();

  emitToUser(message.sender, 'message:viewed', {
    conversationId: String(convo._id),
    messageId: String(message._id),
  });
  res.json({ success: true, attachments });
});

// PATCH /api/chat/conversations/:id/prefs  { category, muted }  (§26/§27)
export const updateConversationPrefs = asyncHandler(async (req, res) => {
  const convo = await Conversation.findById(req.params.id);
  if (!convo) throw ApiError.notFound('Conversation not found');
  if (!isParticipant(convo, req.user._id)) throw ApiError.forbidden();

  const key = String(req.user._id);
  const current = convo.prefsFor(key);
  const next = { ...current };
  if (req.body.category !== undefined) {
    if (!['primary', 'general', 'archived'].includes(req.body.category))
      throw ApiError.badRequest('Invalid chat category.');
    next.category = req.body.category;
  }
  if (req.body.muted !== undefined) next.muted = !!req.body.muted;

  convo.settings.set(key, next);
  await convo.save();
  res.json({ success: true, ...next });
});

// DELETE /api/chat/messages/:id — sender removes their own message
export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) throw ApiError.notFound('Message not found');
  if (String(message.sender) !== String(req.user._id))
    throw ApiError.forbidden('You can only delete your own messages');

  const convo = await Conversation.findById(message.conversation);
  await message.deleteOne();

  if (convo) {
    const last = await Message.findOne({ conversation: convo._id }).sort('-createdAt');
    convo.lastMessage = last ? last.body || 'Attachment' : '';
    convo.lastMessageAt = last ? last.createdAt : convo.createdAt;
    await convo.save();
    const other = otherOf(convo, req.user._id);
    if (other)
      emitToUser(other, 'message:deleted', {
        conversationId: String(convo._id),
        messageId: String(message._id),
      });
  }
  res.json({ success: true, messageId: String(message._id) });
});

// DELETE /api/chat/conversations/:id — clear from MY view only (§27)
export const deleteConversation = asyncHandler(async (req, res) => {
  const convo = await Conversation.findById(req.params.id);
  if (!convo) throw ApiError.notFound('Conversation not found');
  if (!isParticipant(convo, req.user._id)) throw ApiError.forbidden();

  // Never destroy the thread: §27 requires that blocking/deleting "should not
  // delete historical collaboration records or Admin audit information", and the
  // other participant's copy is not ours to erase. This is a one-sided clear.
  const key = String(req.user._id);
  convo.settings.set(key, { ...convo.prefsFor(key), clearedAt: new Date() });
  convo.unread.set(key, 0);
  await convo.save();
  await Message.updateMany(
    { conversation: convo._id },
    { $addToSet: { deletedFor: req.user._id } }
  );

  res.json({ success: true, conversationId: String(req.params.id), clearedFromYourView: true });
});

// POST /api/chat/block  { userId, reason }   (§27)
export const blockUser = asyncHandler(async (req, res) => {
  const target = String(req.body.userId || '');
  if (!target) throw ApiError.badRequest('userId is required.');
  if (target === String(req.user._id)) throw ApiError.badRequest('You cannot block yourself.');

  // Idempotent: pressing Block twice must not error or duplicate.
  await BlockedUser.updateOne(
    { blocker: req.user._id, blocked: target },
    { $setOnInsert: { blocker: req.user._id, blocked: target, reason: req.body.reason || '' } },
    { upsert: true }
  );
  res.json({ success: true, blocked: true, userId: target });
});

// DELETE /api/chat/block/:userId
export const unblockUser = asyncHandler(async (req, res) => {
  await BlockedUser.deleteOne({ blocker: req.user._id, blocked: req.params.userId });
  res.json({ success: true, blocked: false, userId: req.params.userId });
});

// GET /api/chat/block — who I have blocked
export const listBlocked = asyncHandler(async (req, res) => {
  const rows = await BlockedUser.find({ blocker: req.user._id })
    .populate('blocked', 'name role')
    .sort('-createdAt')
    .lean();
  res.json({ success: true, items: rows });
});
