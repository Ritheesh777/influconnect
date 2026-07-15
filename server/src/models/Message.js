import mongoose from 'mongoose';

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, default: '' },
    attachments: [
      {
        type: { type: String, enum: ['image', 'pdf', 'file'], default: 'file' },
        url: String,
        name: String,
        size: Number,
        mime: String,
      },
    ],
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    // §25 — one-time-view images. `viewOnce` marks the intent; `viewedBy` records
    // who has opened it. Once the recipient has viewed it the URL is stripped
    // server-side, so it cannot be recovered from the network tab or a re-fetch.
    viewOnce: { type: Boolean, default: false },
    viewedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    viewOnceConsumedAt: { type: Date, default: null },

    // §27 — one-sided delete; hidden for these users only, never removed.
    deletedFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// Chat search (§28) scans message bodies within a user's own conversations.
messageSchema.index({ body: 'text' });

messageSchema.index({ conversation: 1, createdAt: 1 });

export const Message = mongoose.model('Message', messageSchema);
