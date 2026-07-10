import { Notification } from '../models/Notification.js';
import { emitToUser } from '../sockets/registry.js';

/**
 * Creates a persisted notification and pushes it live over Socket.io.
 * Fire-and-forget from controllers: `notify({ ... })`.
 */
export async function notify({ user, type, title, body = '', link = '', meta = {} }) {
  const notification = await Notification.create({ user, type, title, body, link, meta });
  emitToUser(user, 'notification:new', notification);
  return notification;
}
