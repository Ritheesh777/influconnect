import { verifyToken } from '../utils/token.js';
import { User } from '../models/User.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { Collaboration } from '../models/Collaboration.js';
import { setIO, addOnline, removeOnline, emitToUser } from './registry.js';
import { notify } from '../utils/notify.js';

/** §6 — a conversation is only usable once its collaboration is accepted. */
async function isUnlocked(convo) {
  const collab = convo.collaboration
    ? await Collaboration.findById(convo.collaboration).lean()
    : await Collaboration.findOne({ campaign: convo.campaign, application: convo.application }).lean();
  return Boolean(collab && ['active', 'completed'].includes(collab.status));
}

export function initChat(io) {
  setIO(io);

  // Authenticate every socket connection via JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No auth token'));
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('name role status');
      if (!user || user.status !== 'active') return next(new Error('Unauthorized'));
      socket.user = { id: String(user._id), name: user.name, role: user.role };
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    socket.join(`user:${userId}`);
    addOnline(userId, socket.id);
    io.emit('presence:update', { userId, online: true });

    // Join a conversation room (verifying membership)
    socket.on('conversation:join', async (conversationId) => {
      const convo = await Conversation.findById(conversationId).lean();
      if (convo && convo.participants.some((p) => String(p) === userId)) {
        socket.join(`convo:${conversationId}`);
      }
    });

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`convo:${conversationId}`);
    });

    // Real-time send (mirror of the REST endpoint)
    socket.on('message:send', async ({ conversationId, body, attachments = [] }, ack) => {
      try {
        const convo = await Conversation.findById(conversationId);
        if (!convo || !convo.participants.some((p) => String(p) === userId)) {
          return ack?.({ ok: false, error: 'Not allowed' });
        }
        if (!(await isUnlocked(convo))) {
          return ack?.({
            ok: false,
            error: 'Chat unlocks only after the collaboration is accepted by both parties.',
          });
        }
        const message = await Message.create({
          conversation: convo._id,
          sender: userId,
          body,
          attachments,
          readBy: [userId],
        });
        convo.lastMessage = body || '📎 Attachment';
        convo.lastMessageAt = new Date();
        const other = convo.participants.find((p) => String(p) !== userId);
        if (other) convo.unread.set(String(other), (convo.unread.get(String(other)) || 0) + 1);
        await convo.save();

        const populated = await message.populate('sender', 'name role');
        io.to(`convo:${conversationId}`).emit('message:new', {
          conversationId,
          message: populated,
        });
        if (other) {
          emitToUser(other, 'message:new', { conversationId, message: populated });
          notify({
            user: other,
            type: 'new_message',
            title: 'New message',
            body: `${socket.user.name}: ${(body || 'Attachment').slice(0, 60)}`,
            link: `/messages?c=${conversationId}`,
          });
        }
        ack?.({ ok: true, message: populated });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    // Typing indicator
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`convo:${conversationId}`).emit('typing', {
        conversationId,
        userId,
        name: socket.user.name,
        isTyping,
      });
    });

    // Read receipts
    socket.on('message:read', async ({ conversationId }) => {
      const convo = await Conversation.findById(conversationId);
      if (!convo || !convo.participants.some((p) => String(p) === userId)) return;
      convo.unread.set(userId, 0);
      await convo.save();
      await Message.updateMany(
        { conversation: conversationId, readBy: { $ne: userId } },
        { $addToSet: { readBy: userId } }
      );
      socket.to(`convo:${conversationId}`).emit('message:read', { conversationId, userId });
    });

    socket.on('disconnect', () => {
      removeOnline(userId, socket.id);
      io.emit('presence:update', { userId, online: false });
    });
  });
}
