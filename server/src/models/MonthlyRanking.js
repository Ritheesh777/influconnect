import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * A permanent snapshot of a user's rank for one month (v2 §14).
 * The live monthly count resets each period, but these rows are never deleted
 * (BR-NEW-011: "historical ranking achievements must be preserved").
 */
const monthlyRankingSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['company', 'creator'], required: true },
    period: { type: String, required: true }, // 'YYYY-MM'
    completed: { type: Number, default: 0 }, // collaborations completed that month
    rankKey: { type: String },
    rankName: { type: String },
    discountPercent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

monthlyRankingSchema.index({ user: 1, period: 1 }, { unique: true });

export const MonthlyRanking = mongoose.model('MonthlyRanking', monthlyRankingSchema);
