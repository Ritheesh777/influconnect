import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * A private chat channel between one company and one creator, tied to a campaign.
 * Locked until a collaboration is accepted (BR-NEW-008) — applying is not enough.
 */

/**
 * Per-user chat preferences (v2 §26/§27).
 *
 * Deliberately per-user rather than per-conversation: when a company archives or
 * mutes a chat, the creator's view of that same chat must be unaffected.
 * Keyed by userId in `settings` below.
 */
const chatPrefSchema = new Schema(
  {
    // §26 — PRIMARY / GENERAL / ARCHIVED tabs
    category: { type: String, enum: ['primary', 'general', 'archived'], default: 'general' },
    muted: { type: Boolean, default: false },
    // §27 — "delete conversation from personal view where permitted": a one-sided
    // hide. Older messages vanish for this user only; the other participant's
    // history and the admin audit trail stay intact.
    clearedAt: { type: Date, default: null },
  },
  { _id: false }
);

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
    // Per-user preferences keyed by userId
    settings: { type: Map, of: chatPrefSchema, default: {} },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, updatedAt: -1 });

/** Preferences for one user, falling back to defaults when never set. */
conversationSchema.methods.prefsFor = function (userId) {
  const p = this.settings?.get(String(userId));
  return { category: p?.category || 'general', muted: !!p?.muted, clearedAt: p?.clearedAt || null };
};

export const Conversation = mongoose.model('Conversation', conversationSchema);
