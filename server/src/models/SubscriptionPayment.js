import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * An audit record of every subscription payment attempt (v2 §8, §34).
 * These are financial records — never hard-deleted, even when a user deletes
 * their account (§34 says audit/financial records must be retained).
 */
const subscriptionPaymentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    planCode: { type: String },
    audience: { type: String, enum: ['company', 'creator'] },

    // Money, in paise
    basePaise: { type: Number, required: true },
    discountPaise: { type: Number, default: 0 },
    amountPaise: { type: Number, required: true }, // what we actually charge
    currency: { type: String, default: 'INR' },

    // Exactly how the price was reached — so any dispute is explainable
    breakdown: {
      firstSubscriptionPercent: { type: Number, default: 0 },
      rankPercent: { type: Number, default: 0 },
      couponPercent: { type: Number, default: 0 },
      couponFixedPaise: { type: Number, default: 0 },
      cappedAtPercent: { type: Number, default: 0 },
      effectivePercent: { type: Number, default: 0 },
    },
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    couponCode: { type: String, default: '' },

    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    failureReason: { type: String, default: '' },
    paidAt: { type: Date },
    periodStart: { type: Date },
    periodEnd: { type: Date },
  },
  { timestamps: true }
);

export const SubscriptionPayment = mongoose.model('SubscriptionPayment', subscriptionPaymentSchema);
