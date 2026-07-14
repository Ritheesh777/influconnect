/**
 * Creator loyalty tiers — driven by COMPLETED, on-platform collaborations.
 *
 * This is the anti-disintermediation lever: the discount only accrues when a
 * collaboration is actually finished inside InfluConnect, so creators have a
 * standing reason to keep deals on-platform rather than moving to DMs.
 *
 * Payments/subscriptions ship in v2 — until then `discountPercent` is computed
 * and displayed (an earned benefit waiting to be redeemed), not charged.
 */
export const CREATOR_TIERS = [
  { key: 'starter', name: 'Starter', min: 0, max: 2, discountPercent: 0 },
  { key: 'active', name: 'Active', min: 3, max: 5, discountPercent: 10 },
  { key: 'trusted', name: 'Trusted', min: 6, max: 10, discountPercent: 20 },
  { key: 'power', name: 'Power Creator', min: 11, max: 20, discountPercent: 30 },
  { key: 'elite', name: 'Elite', min: 21, max: Infinity, discountPercent: 45 },
];

export function tierFor(completedCount = 0) {
  const n = Number(completedCount) || 0;
  const tier = CREATOR_TIERS.find((t) => n >= t.min && n <= t.max) || CREATOR_TIERS[0];
  const idx = CREATOR_TIERS.indexOf(tier);
  const next = CREATOR_TIERS[idx + 1] || null;
  return {
    key: tier.key,
    name: tier.name,
    discountPercent: tier.discountPercent,
    completed: n,
    next: next
      ? {
          name: next.name,
          at: next.min,
          remaining: Math.max(0, next.min - n),
          discountPercent: next.discountPercent,
        }
      : null,
  };
}
