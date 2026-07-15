import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * A user-submitted support request (v2 §33): report a problem, technical issue,
 * or subscription/payment support. Distinct from Complaint, which reports
 * another *user*; this reports the platform.
 */
const supportTicketSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: {
      type: String,
      enum: ['technical', 'subscription', 'payment', 'account', 'campaign', 'other'],
      default: 'other',
      index: true,
    },
    subject: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 4000 },
    attachments: [{ url: String, name: String, type: String }],

    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    // Filled in by an admin when they reply
    adminResponse: { type: String, default: '' },
    respondedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

supportTicketSchema.index({ user: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, createdAt: -1 });

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
