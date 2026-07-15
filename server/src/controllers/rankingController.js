import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { rankingProfile, rankLadder, periodKey } from '../utils/ranking.js';
import { User } from '../models/User.js';
import { MonthlyRanking } from '../models/MonthlyRanking.js';
import { CreatorProfile } from '../models/CreatorProfile.js';
import { CompanyProfile } from '../models/CompanyProfile.js';

/**
 * Monthly ranking + trophies (v2 §13–§16).
 * Read-only: rank is derived from completed collaborations, never set by hand.
 */

// GET /api/ranking/me — my rank, history, trophies (§14, §15, §35)
export const myRanking = asyncHandler(async (req, res) => {
  const role = req.user.role === 'company' ? 'company' : 'creator';
  const [profile, ladder] = await Promise.all([rankingProfile(req.user._id, role), rankLadder()]);
  res.json({
    success: true,
    ...profile,
    // The ladder drives the progress UI; Infinity has no JSON form, so the open
    // top rank is sent as null and rendered as "26+".
    ladder: ladder.map((r) => ({
      key: r.key,
      name: r.name,
      min: r.min,
      max: Number.isFinite(r.max) ? r.max : null,
      discountPercent: r.discountPercent,
    })),
  });
});

// GET /api/ranking/user/:id — public rank summary shown on a profile (§15)
export const userRanking = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('role status').lean();
  if (!user || user.status === 'deleted') throw ApiError.notFound('User not found');
  const role = user.role === 'company' ? 'company' : 'creator';
  const p = await rankingProfile(user._id, role);
  // Only the badge-worthy parts are public — §15 lists current rank, highest
  // rank, previous month's award and total collaborations. Month-by-month
  // history stays private to the owner and to admins.
  res.json({
    success: true,
    current: { name: p.current.name, key: p.current.key },
    highest: p.highest,
    previousMonth: p.previousMonth,
    lifetimeCollaborations: p.lifetimeCollaborations,
  });
});

// GET /api/ranking/leaderboard?role=creator&period=YYYY-MM
export const leaderboard = asyncHandler(async (req, res) => {
  const role = req.query.role === 'company' ? 'company' : 'creator';
  const period = req.query.period || periodKey();

  const rows = await MonthlyRanking.find({ role, period })
    .sort('-completed')
    .limit(50)
    .populate('user', 'name role status isAdminVerified')
    .lean();

  // A deleted user's row is kept for audit but must not be paraded publicly.
  const visible = rows.filter((r) => r.user && r.user.status !== 'deleted');

  const ids = visible.map((r) => r.user._id);
  const [creatorPics, companyPics] = await Promise.all([
    CreatorProfile.find({ user: { $in: ids } }).select('user avatarUrl').lean(),
    CompanyProfile.find({ user: { $in: ids } }).select('user logoUrl').lean(),
  ]);
  const pic = Object.fromEntries([
    ...creatorPics.map((p) => [String(p.user), p.avatarUrl]),
    ...companyPics.map((p) => [String(p.user), p.logoUrl]),
  ]);

  res.json({
    success: true,
    period,
    role,
    items: visible.map((r, i) => ({
      position: i + 1,
      user: {
        _id: r.user._id,
        name: r.user.name,
        role: r.user.role,
        isAdminVerified: r.user.isAdminVerified,
        avatarUrl: pic[String(r.user._id)] || '',
      },
      rank: r.rankName,
      rankKey: r.rankKey,
      completed: r.completed,
    })),
  });
});
