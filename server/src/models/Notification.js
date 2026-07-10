import mongoose from 'mongoose';

const { Schema } = mongoose;

export const NOTIFICATION_TYPES = [
  'campaign_match',
  'application_received',
  'application_accepted',
  'application_rejected',
  'invitation_received',
  'new_message',
  'deadline_reminder',
  'review_received',
  'complaint_update',
  'account_status',
];

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    link: { type: String, default: '' }, // client route to open
    meta: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
