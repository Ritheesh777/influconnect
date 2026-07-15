/**
 * Monthly ranking + trophies (v2 §13–§16).
 *
 * Rank is earned from collaborations COMPLETED within the current month, and
 * the monthly counter resets each period (§14) — but history is never deleted
 * (BR-NEW-011): we snapshot each month into MonthlyRanking instead.
 *
 * Thresholds and discounts are configurable (§13, §16); these are the defaults.
 */
/** Fallback ladder, used only before an admin has saved any settings. */
export const RANKS = [
  { key: 'rookie', name: 'Rookie', min: 0, max: 3, discountPercent: 0 },
  { key: 'bronze', name: 'Bronze', min: 4, max: 7, discountPercent: 5 },
  { key: 'silver', name: 'Silver', min: 8, max: 15, discountPercent: 10 },
  { key: 'gold', name: 'Gold', min: 16, max: 25, discountPercent: 15 },
  { key: 'platinum', name: 'Platinum', min: 26, max: Infinity, discountPercent: 20 },
];

/**
 * The live ladder, from admin settings (§13/§16). `max: null` in the DB means
 * "no ceiling" — normalised to Infinity so the same comparison works for both.
 */
export async function rankLadder() {
  try {
    const { PlatformSettings } = await import('../models/PlatformSettings.js');
    const s = await PlatformSettings.get();
    if (!s?.ranks?.length) return RANKS;
    return s.ranks
      .map((r) => ({
        key: r.key,
        name: r.name,
        min: r.min,
        max: r.max === null || r.max === undefined ? Infinity : r.max,
        discountPercent: r.discountPercent,
      }))
      .sort((a, b) => a.min - b.min);
  } catch {
    // Never let a settings read break ranking — fall back to the defaults.
    return RANKS;
  }
}

/** Synchronous rank lookup against a supplied ladder (defaults when omitted). */
export function rankForWith(ladder, completedThisMonth = 0) {
  const n = Number(completedThisMonth) || 0;
  const rank = ladder.find((r) => n >= r.min && n <= r.max) || ladder[0];
  const idx = ladder.indexOf(rank);
  const next = ladder[idx + 1] || null;
  return {
    key: rank.key,
    name: rank.name,
    discountPercent: rank.discountPercent,
    completedThisMonth: n,
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

/** Rank lookup using the admin-configured ladder. */
export async function rankFor(completedThisMonth = 0) {
  return rankForWith(await rankLadder(), completedThisMonth);
}

/** 'YYYY-MM' key for the current ranking period. */
export function periodKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function periodBounds(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return { start, end };
}

/**
 * Records/updates this user's rank snapshot for the current month (§14).
 * Imported lazily inside the function to avoid a model import cycle.
 */
export async function snapshotRanking(userId, role) {
  const { MonthlyRanking } = await import('../models/MonthlyRanking.js');
  const { Collaboration } = await import('../models/Collaboration.js');
  const { start, end } = periodBounds();

  const completed = await Collaboration.countDocuments({
    [role]: userId,
    status: 'completed',
    completedAt: { $gte: start, $lt: end },
  });
  const rank = await rankFor(completed);

  await MonthlyRanking.findOneAndUpdate(
    { user: userId, period: periodKey() },
    {
      user: userId,
      role,
      period: periodKey(),
      completed,
      rankKey: rank.key,
      rankName: rank.name,
      discountPercent: rank.discountPercent,
    },
    { upsert: true }
  );
  return rank;
}

/** Live rank + history for a profile/dashboard (§14, §15). */
export async function rankingProfile(userId, role) {
  const { MonthlyRanking } = await import('../models/MonthlyRanking.js');
  const { Collaboration } = await import('../models/Collaboration.js');
  const { start, end } = periodBounds();

  const [thisMonth, lifetime, history] = await Promise.all([
    Collaboration.countDocuments({ [role]: userId, status: 'completed', completedAt: { $gte: start, $lt: end } }),
    Collaboration.countDocuments({ [role]: userId, status: 'completed' }),
    MonthlyRanking.find({ user: userId }).sort('-period').limit(12).lean(),
  ]);

  const ladder = await rankLadder();
  const current = rankForWith(ladder, thisMonth);
  const previous = history.find((h) => h.period !== periodKey()) || null;
  // Highest rank ever achieved — history survives the monthly reset (BR-NEW-011).
  // Seniority is measured against the *live* ladder so a renamed or re-ordered
  // rank is still compared on the correct scale. A historic rank the admin has
  // since removed scores -1 and simply loses, rather than throwing.
  const highest = history.reduce(
    (best, h) => {
      const i = ladder.findIndex((r) => r.key === h.rankKey);
      return i > best.i ? { i, name: h.rankName, period: h.period } : best;
    },
    { i: ladder.findIndex((r) => r.key === current.key), name: current.name, period: periodKey() }
  );

  return {
    current,
    period: periodKey(),
    previousMonth: previous ? { rank: previous.rankName, period: previous.period, completed: previous.completed } : null,
    highest: { rank: highest.name, period: highest.period },
    lifetimeCollaborations: lifetime,
    history: history.map((h) => ({ period: h.period, rank: h.rankName, completed: h.completed })),
  };
}
