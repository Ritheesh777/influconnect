import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { Collaboration } from '../models/Collaboration.js';
import { emitToUser } from '../sockets/registry.js';
import { notify } from '../utils/notify.js';

function isParticipant(convo, userId) {
  return convo.participants.some((p) => String(p._id || p) === String(userId));
}

/**
 * §6 Chat unlock rule — a conversation is only usable once it is backed by an
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
  const ok =
    collab && ['active', 'completed'].includes(collab.status);
  if (!ok)
    throw ApiError.forbidden(
      'Chat unlocks only after the collaboration is accepted by both parties.'
    );
  return collab;
}

// GET /api/chat/conversations
export const getConversations = asyncHandler(async (req, res) => {
  const convos = await Conversation.find({ participants: req.user._id })
    .sort('-lastMessageAt -updatedAt')
    .populate('participants', 'name role')
    .populate('campaign', 'title')
    .lean();

  // Only surface threads backed by an accepted collaboration (§6)
  const collabs = await Collaboration.find({
    _id: { $in: convos.map((c) => c.collaboration).filter(Boolean) },
    status: { $in: ['active', 'completed'] },
  })
    .select('_id')
    .lean();
  const unlockedIds = new Set(collabs.map((c) => String(c._id)));

  const items = convos
    .filter((c) => c.collaboration && unlockedIds.has(String(c.collaboration)))
    .map((c) => ({
      ...c,
      unreadCount: c.unread?.[String(req.user._id)] || 0,
      otherParty: c.participants.find((p) => String(p._id) !== String(req.user._id)),
    }));
  res.json({ success: true, items });
});

// GET /api/chat/conversations/:id/messages
export const getMessages = asyncHandler(async (req, res) => {
  const convo = await Conversation.findById(req.params.id);
  if (!convo) throw ApiError.notFound('Conversation not found');
  if (!isParticipant(convo, req.user._id)) throw ApiError.forbidden();
  await assertUnlocked(convo);

  const messages = await Message.find({ conversation: convo._id }).sort('createdAt').lean();

  // Mark as read for this user
  convo.unread.set(String(req.user._id), 0);
  await convo.save();
  await Message.updateMany(
    { conversation: convo._id, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id } }
  );

  res.json({ success: true, conversation: convo, messages });
});

// POST /api/chat/conversations/:id/messages  { body, attachments }
export const sendMessage = asyncHandler(async (req, res) => {
  const convo = await Conversation.findById(req.params.id);
  if (!convo) throw ApiError.notFound('Conversation not found');
  if (!isParticipant(convo, req.user._id)) throw ApiError.forbidden();
  await assertUnlocked(convo);

  const message = await Message.create({
    conversation: convo._id,
    sender: req.user._id,
    body: req.body.body || '',
    attachments: req.body.attachments || [],
    readBy: [req.user._id],
  });

  convo.lastMessage = message.body || '📎 Attachment';
  convo.lastMessageAt = new Date();
  const other = convo.participants.find((p) => String(p) !== String(req.user._id));
  if (other) convo.unread.set(String(other), (convo.unread.get(String(other)) || 0) + 1);
  await convo.save();

  const populated = await message.populate('sender', 'name role');
  // Live push to the other participant
  if (other) {
    emitToUser(other, 'message:new', { conversationId: convo._id, message: populated });
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

// DELETE /api/chat/messages/:id  — sender may delete their own message
export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) throw ApiError.notFound('Message not found');
  if (String(message.sender) !== String(req.user._id))
    throw ApiError.forbidden('You can only delete your own messages');

  const convo = await Conversation.findById(message.conversation);
  await message.deleteOne();

  // Keep the conversation preview honest after a delete
  if (convo) {
    const last = await Message.findOne({ conversation: convo._id }).sort('-createdAt');
    convo.lastMessage = last ? last.body || 'Attachment' : '';
    convo.lastMessageAt = last ? last.createdAt : convo.createdAt;
    await convo.save();
    const other = convo.participants.find((p) => String(p) !== String(req.user._id));
    if (other)
      emitToUser(other, 'message:deleted', {
        conversationId: String(convo._id),
        messageId: String(message._id),
      });
  }
  res.json({ success: true, messageId: String(message._id) });
});

// DELETE /api/chat/conversations/:id — a participant may delete the thread
export const deleteConversation = asyncHandler(async (req, res) => {
  const convo = await Conversation.findById(req.params.id);
  if (!convo) throw ApiError.notFound('Conversation not found');
  if (!isParticipant(convo, req.user._id)) throw ApiError.forbidden();

  const other = convo.participants.find((p) => String(p) !== String(req.user._id));
  await Message.deleteMany({ conversation: convo._id });
  await convo.deleteOne();
  if (other) emitToUser(other, 'conversation:deleted', { conversationId: String(req.params.id) });
  res.json({ success: true, conversationId: String(req.params.id) });
});
