import { asyncHandler } from '../utils/asyncHandler.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';

// GET /api/notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const items = await Notification.find({ user: req.user._id }).sort('-createdAt').limit(100).lean();
  const unread = await Notification.countDocuments({ user: req.user._id, isRead: false });
  res.json({ success: true, items, unread });
});

// PATCH /api/notifications/:id/read
export const markRead = asyncHandler(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { isRead: true });
  res.json({ success: true });
});

// PATCH /api/notifications/read-all
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true });
});

// DELETE /api/notifications  (clear all)
export const clearAll = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ user: req.user._id });
  res.json({ success: true });
});

// PATCH /api/notifications/preferences  { email, browser }
export const updatePreferences = asyncHandler(async (req, res) => {
  const prefs = {};
  if ('email' in req.body) prefs['notificationPrefs.email'] = req.body.email;
  if ('browser' in req.body) prefs['notificationPrefs.browser'] = req.body.browser;
  const user = await User.findByIdAndUpdate(req.user._id, prefs, { new: true });
  res.json({ success: true, notificationPrefs: user.notificationPrefs });
});
