import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * A private chat channel between one company and one creator, tied to a campaign.
 * Unlocks once an application is submitted (business rule from the brief).
 */
const conversationSchema = new Schema(
  {
    campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', index: true },
    application: { type: Schema.Types.ObjectId, ref: 'Application' },
    collaboration: { type: Schema.Types.ObjectId, ref: 'Collaboration' },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],

    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date },
    // Unread counts keyed by userId
    unread: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, updatedAt: -1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
