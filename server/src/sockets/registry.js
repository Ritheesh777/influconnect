/**
 * Holds the Socket.io server instance and a map of userId -> Set<socketId>,
 * so REST controllers can push real-time events (notifications, messages)
 * without importing the HTTP layer.
 */
let io = null;
const online = new Map(); // userId -> Set of socketIds

export function setIO(instance) {
  io = instance;
}
export function getIO() {
  return io;
}

export function addOnline(userId, socketId) {
  const key = String(userId);
  if (!online.has(key)) online.set(key, new Set());
  online.get(key).add(socketId);
}

export function removeOnline(userId, socketId) {
  const key = String(userId);
  const set = online.get(key);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) online.delete(key);
}

export function isOnline(userId) {
  return online.has(String(userId));
}

/** Emit an event to every socket of a given user (their personal room). */
export function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${String(userId)}`).emit(event, payload);
}
