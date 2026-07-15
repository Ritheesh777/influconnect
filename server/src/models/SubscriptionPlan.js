import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * A purchasable monthly plan (v2 §8). Prices are stored in PAISE (integer) —
 * never floats — because money in floating point silently loses precision.
 * ₹499.00 → 49900.
 */
const subscriptionPlanSchema = new Schema(
  {
    code: { type: String, required: true, unique: true }, // 'creator-monthly'
    name: { type: String, required: true }, // 'Creator Monthly'
    audience: { type: String, enum: ['company', 'creator'], required: true },
    pricePaise: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    interval: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    // null = unlimited collaborations while the plan is active (§7)
    collabLimit: { type: Number, default: null },
    features: [{ type: String }],
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
