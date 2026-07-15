import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * One user blocking another (v2 §27).
 *
 * Blocking stops *new interaction* only. Per §27 it must never delete history:
 * collaborations, reviews and the admin audit trail all survive a block, and
 * the messages already exchanged stay readable to both sides and to admins.
 */
const blockedUserSchema = new Schema(
  {
    // The person who pressed "Block"
    blocker: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // The person who can no longer start new interaction
    blocked: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reason: { type: String, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

// One block row per direction — pressing Block twice must not create duplicates.
blockedUserSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

/** True when either party has blocked the other — blocking is symmetric for messaging. */
blockedUserSchema.statics.betweenPair = async function (a, b) {
  const rows = await this.find({
    $or: [
      { blocker: a, blocked: b },
      { blocker: b, blocked: a },
    ],
  }).lean();
  return {
    any: rows.length > 0,
    iBlockedThem: rows.some((r) => String(r.blocker) === String(a)),
    theyBlockedMe: rows.some((r) => String(r.blocker) === String(b)),
  };
};

export const BlockedUser = mongoose.model('BlockedUser', blockedUserSchema);
