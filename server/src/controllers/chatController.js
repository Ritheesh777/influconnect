import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { emitToUser } from '../sockets/registry.js';
import { notify } from '../utils/notify.js';

function isParticipant(convo, userId) {
  return convo.participants.some((p) => String(p._id || p) === String(userId));
}

// GET /api/chat/conversations
export const getConversations = asyncHandler(async (req, res) => {
  const convos = await Conversation.find({ participants: req.user._id })
    .sort('-lastMessageAt -updatedAt')
    .populate('participants', 'name role')
    .populate('campaign', 'title')
    .lean();
  const items = convos.map((c) => ({
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
