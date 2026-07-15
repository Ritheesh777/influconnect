import { Coupon, CouponUsage } from '../models/Coupon.js';
import { SubscriptionPayment } from '../models/SubscriptionPayment.js';
import { Collaboration } from '../models/Collaboration.js';
import { rankFor } from './ranking.js';
import { ApiError } from './apiError.js';

/**
 * Discount engine (v2 §10, §11, §12, §16).
 *
 * Stacking order: first-subscription % + rank % + coupon %, then a hard CAP so
 * combined discounts can never make a plan free or negative (§11 requires this).
 * A fixed-amount coupon is applied after the percentage math.
 *
 * Every number here is configurable rather than hardcoded (§10) — these are the
 * defaults until the admin settings UI lands.
 */
export const PRICING_CONFIG = {
  firstSubscriptionPercent: 70, // §10 — recommended initial configuration
  maxCombinedPercent: 80, // §11 — combined discounts may never exceed this
  minChargeablePaise: 100, // ₹1 — Razorpay rejects tiny/zero amounts
};

/** Has this user ever paid for a subscription before? (§10 first-sub discount) */
export async function isFirstSubscription(userId) {
  const prior = await SubscriptionPayment.countDocuments({ user: userId, status: 'paid' });
  return prior === 0;
}

/** Rank-based discount (§16) — driven by this month's completed collaborations. */
export async function rankDiscountFor(userId, role) {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const completedThisMonth = await Collaboration.countDocuments({
    [role]: userId,
    status: 'completed',
    completedAt: { $gte: start },
  });
  const rank = rankFor(completedThisMonth);
  return { rank, percent: rank.discountPercent, completedThisMonth };
}

/**
 * Works out the final payable amount. Pure calculation + validation:
 * it never mutates anything, so it's safe to call for a live price preview.
 */
export async function quotePrice({ user, plan, couponCode }) {
  const role = plan.audience; // 'company' | 'creator'
  const base = plan.pricePaise;

  const first = (await isFirstSubscription(user._id)) ? PRICING_CONFIG.firstSubscriptionPercent : 0;
  const { rank, percent: rankPercent } = await rankDiscountFor(user._id, role);

  let coupon = null;
  let couponPercent = 0;
  let couponFixedPaise = 0;
  let couponError = null;

  if (couponCode) {
    coupon = await Coupon.findOne({ code: String(couponCode).toUpperCase().trim() });
    if (!coupon) {
      couponError = 'That coupon code does not exist.';
    } else {
      couponError = coupon.invalidReason({ audience: role, amountPaise: base });
      if (!couponError && coupon.perUserLimit !== null) {
        const mine = await CouponUsage.countDocuments({ coupon: coupon._id, user: user._id });
        if (mine >= coupon.perUserLimit) couponError = 'You have already used this coupon.';
      }
      if (!couponError) {
        if (coupon.type === 'percent') couponPercent = coupon.value;
        else couponFixedPaise = coupon.value;
      }
      if (couponError) coupon = null;
    }
  }

  // Percentages stack, then get capped (§11)
  const rawPercent = first + rankPercent + couponPercent;
  const effectivePercent = Math.min(rawPercent, PRICING_CONFIG.maxCombinedPercent);
  const capped = rawPercent > PRICING_CONFIG.maxCombinedPercent;

  let amount = Math.round(base * (1 - effectivePercent / 100));
  amount -= couponFixedPaise; // fixed coupons apply after the percentages
  amount = Math.max(PRICING_CONFIG.minChargeablePaise, amount); // never free/negative

  const discount = base - amount;

  return {
    plan: { code: plan.code, name: plan.name, audience: plan.audience, collabLimit: plan.collabLimit },
    currency: plan.currency,
    basePaise: base,
    discountPaise: discount,
    amountPaise: amount,
    // rupee values for display
    base: base / 100,
    discount: discount / 100,
    amount: amount / 100,
    breakdown: {
      firstSubscriptionPercent: first,
      rankPercent,
      rankName: rank.name,
      couponPercent,
      couponFixedPaise,
      cappedAtPercent: capped ? PRICING_CONFIG.maxCombinedPercent : 0,
      effectivePercent,
      maxCombinedPercent: PRICING_CONFIG.maxCombinedPercent,
    },
    coupon: coupon ? { _id: coupon._id, code: coupon.code, description: coupon.description } : null,
    couponError,
  };
}

/** Same as quotePrice but throws if a supplied coupon is invalid (checkout path). */
export async function quoteOrThrow({ user, plan, couponCode }) {
  const q = await quotePrice({ user, plan, couponCode });
  if (couponCode && q.couponError) throw ApiError.badRequest(q.couponError);
  return q;
}
