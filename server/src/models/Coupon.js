import mongoose from 'mongoose';

const { Schema } = mongoose;

/** Coupon codes managed by the Administrator (v2 §12). */
const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
    value: { type: Number, required: true, min: 0 }, // percent (0-100) or paise
    audience: { type: String, enum: ['company', 'creator', 'all'], default: 'all' },

    startsAt: { type: Date },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true, index: true },

    usageLimit: { type: Number, default: null }, // total redemptions allowed
    perUserLimit: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    minAmountPaise: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/** Why a coupon can't be used right now — null means it's usable. */
couponSchema.methods.invalidReason = function invalidReason({ audience, amountPaise }) {
  const now = new Date();
  if (!this.isActive) return 'This coupon is no longer active.';
  if (this.startsAt && now < this.startsAt) return 'This coupon is not active yet.';
  if (this.expiresAt && now > this.expiresAt) return 'This coupon has expired.';
  if (this.audience !== 'all' && this.audience !== audience)
    return `This coupon is only valid for ${this.audience} accounts.`;
  if (this.usageLimit !== null && this.usedCount >= this.usageLimit)
    return 'This coupon has reached its usage limit.';
  if (amountPaise < this.minAmountPaise)
    return `This coupon requires a minimum amount of ₹${(this.minAmountPaise / 100).toFixed(0)}.`;
  return null;
};

export const Coupon = mongoose.model('Coupon', couponSchema);

/** One row per redemption — enforces the per-user limit. */
const couponUsageSchema = new Schema(
  {
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    payment: { type: Schema.Types.ObjectId, ref: 'SubscriptionPayment' },
    discountPaise: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const CouponUsage = mongoose.model('CouponUsage', couponUsageSchema);
