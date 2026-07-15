import { Collaboration } from '../models/Collaboration.js';
import { ApiError } from './apiError.js';

/**
 * Free collaboration quota (v2 §4, §5, §6 · BR-NEW-002/003/004).
 *
 * Both Companies and Creators get 3 free SUCCESSFUL collaborations.
 * "Successful" = a collaboration was actually created by mutual acceptance
 * (§4's example counts *accepted* creators), so we count active + completed —
 * not just completed, and cancelled ones don't burn quota.
 *
 * Enforced on the backend immediately before a collaboration is created (§6, §36),
 * so applications/invitations can never sneak past the limit.
 */
/** Fallback, used only before an admin has saved any settings. */
export const FREE_COLLAB_LIMIT = 3;

/** The configured free limit (§4/§5), falling back to the default. */
export async function freeLimit() {
  try {
    const { PlatformSettings } = await import('../models/PlatformSettings.js');
    const s = await PlatformSettings.get();
    return s?.freeCollabLimit ?? FREE_COLLAB_LIMIT;
  } catch {
    return FREE_COLLAB_LIMIT;
  }
}

/** The first-subscription discount, for display on quota cards (§10/§35). */
async function firstSubDiscount() {
  const { pricingConfig } = await import('./pricing.js');
  return (await pricingConfig()).firstSubscriptionPercent;
}

/** An active, unexpired subscription lifts the free limit (§7). */
export function hasActiveSubscription(user) {
  const s = user?.subscription;
  if (!s || s.status !== 'active') return false;
  if (s.expiresAt && new Date(s.expiresAt) < new Date()) return false;
  return true;
}

/** Collaborations that count against the quota for this user. */
export function countCollaborations(userId, role) {
  return Collaboration.countDocuments({
    [role]: userId,
    status: { $in: ['active', 'completed'] },
  });
}

/** Quota snapshot for dashboards (§35). */
export async function quotaFor(user, role) {
  const used = await countCollaborations(user._id, role);
  const subscribed = hasActiveSubscription(user);
  const planLimit = user?.subscription?.collabLimit ?? null;

  if (subscribed) {
    return {
      plan: user.subscription.plan || 'subscribed',
      subscribed: true,
      unlimited: planLimit === null,
      limit: planLimit,
      used,
      remaining: planLimit === null ? null : Math.max(0, planLimit - used),
      requiresSubscription: false,
      expiresAt: user.subscription.expiresAt || null,
    };
  }

  const limit = await freeLimit();
  return {
    plan: 'free',
    subscribed: false,
    unlimited: false,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    requiresSubscription: used >= limit,
    firstSubscriptionDiscount: await firstSubDiscount(),
  };
}

/**
 * The exact wording required by §4 and §5, with the limit interpolated so the
 * message stays true if an admin changes it from 3.
 */
function limitMessage(role, limit) {
  return role === 'company'
    ? `Your ${limit} free collaborations have been used. Subscribe to continue collaborating with creators.`
    : `You have completed your ${limit} free collaborations. Subscribe to continue collaborating with brands.`;
}

/**
 * Throws unless `user` may enter one more collaboration.
 * `role` is 'company' | 'creator' — the side this user plays.
 */
export async function assertCanCollaborate(user, role) {
  if (hasActiveSubscription(user)) {
    const limit = user.subscription.collabLimit;
    if (limit === null || limit === undefined) return; // unlimited plan
    const used = await countCollaborations(user._id, role);
    if (used >= limit)
      throw ApiError.forbidden(
        `You have reached your plan limit of ${limit} collaborations. Upgrade to continue.`
      );
    return;
  }

  const used = await countCollaborations(user._id, role);
  const limit = await freeLimit();
  if (used >= limit) throw ApiError.forbidden(limitMessage(role, limit));
}
