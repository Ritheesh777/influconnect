import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/User.js';
import { CompanyProfile } from '../models/CompanyProfile.js';
import { CreatorProfile } from '../models/CreatorProfile.js';
import { Campaign } from '../models/Campaign.js';
import { Application } from '../models/Application.js';
import { Collaboration } from '../models/Collaboration.js';
import { Complaint } from '../models/Complaint.js';
import { Review } from '../models/Review.js';
import { MonthlyRanking } from '../models/MonthlyRanking.js';
import { SubscriptionPayment } from '../models/SubscriptionPayment.js';
import { rankingProfile } from '../utils/ranking.js';
import { quotaFor } from '../utils/quota.js';

/**
 * Admin relationship inspection (v2 §29–§32).
 *
 * BR-NEW-016: "Only Administrators receive expanded cross-platform
 * collaboration-history visibility." These endpoints deliberately return the
 * *unmasked* records that `privacy.js` hides from normal users — every route
 * here is behind `authorize('admin')` in adminRoutes.js. Do not reuse these
 * shapes on any user-facing endpoint.
 */

/** Compact user card used everywhere a related entity is listed and clicked. */
function card(u, profile) {
  if (!u) return null;
  return {
    _id: u._id,
    name: u.name,
    role: u.role,
    email: u.email,
    status: u.status,
    isAdminVerified: u.isAdminVerified,
    avatarUrl: profile?.avatarUrl || profile?.logoUrl || '',
  };
}

// GET /api/admin/inspect/company/:id  (§29)
export const inspectCompany = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user || user.role !== 'company') throw ApiError.notFound('Company not found');
  const profile = await CompanyProfile.findOne({ user: user._id }).lean();

  const campaigns = await Campaign.find({ company: user._id })
    .select('title status category deadline createdAt viewsCount')
    .sort('-createdAt')
    .lean();
  const campaignIds = campaigns.map((c) => c._id);

  const appCounts = await Application.aggregate([
    { $match: { campaign: { $in: campaignIds } } },
    { $group: { _id: '$campaign', n: { $sum: 1 } } },
  ]);
  const appMap = Object.fromEntries(appCounts.map((a) => [String(a._id), a.n]));

  const collabs = await Collaboration.find({ company: user._id })
    .populate('creator', 'name role email status isAdminVerified')
    .populate('campaign', 'title')
    .sort('-createdAt')
    .lean();

  // §29 — "Creators collaborated with" + their pictures, each clickable
  const creatorIds = [...new Set(collabs.map((c) => String(c.creator?._id)).filter(Boolean))];
  const creatorProfiles = await CreatorProfile.find({ user: { $in: creatorIds } })
    .select('user avatarUrl')
    .lean();
  const avatarMap = Object.fromEntries(creatorProfiles.map((p) => [String(p.user), p.avatarUrl]));

  const partners = creatorIds.map((id) => {
    const mine = collabs.filter((c) => String(c.creator?._id) === id);
    return {
      ...card(mine[0].creator, { avatarUrl: avatarMap[id] }),
      collaborations: mine.length,
      active: mine.filter((c) => c.status === 'active').length,
      completed: mine.filter((c) => c.status === 'completed').length,
      campaigns: mine.map((c) => ({ _id: c.campaign?._id, title: c.campaign?.title, status: c.status })),
    };
  });

  const [complaintsBy, complaintsAgainst, reviews, payments] = await Promise.all([
    Complaint.find({ reporter: user._id })
      .populate('targetUser', 'name role')
      .populate('targetCampaign', 'title')
      .sort('-createdAt')
      .lean(),
    // Complaints about this company, whether aimed at them directly or at one
    // of their campaigns — both belong in their moderation history.
    Complaint.find({ $or: [{ targetUser: user._id }, { targetCampaign: { $in: campaignIds } }] })
      .populate('reporter', 'name role')
      .populate('targetCampaign', 'title')
      .sort('-createdAt')
      .lean(),
    Review.find({ $or: [{ author: user._id }, { subject: user._id }] })
      .populate('author', 'name role')
      .populate('subject', 'name role')
      .sort('-createdAt')
      .lean(),
    SubscriptionPayment.find({ user: user._id }).sort('-createdAt').lean(),
  ]);

  res.json({
    success: true,
    user: card(user, profile),
    profile,
    accountStatus: { status: user.status, verified: user.isAdminVerified, deletedAt: user.deletedAt },
    subscription: user.subscription || null,
    quota: await quotaFor(user, 'company'),
    ranking: await rankingProfile(user._id, 'company'),
    campaigns: campaigns.map((c) => ({ ...c, applications: appMap[String(c._id)] || 0 })),
    campaignStats: {
      total: campaigns.length,
      active: campaigns.filter((c) => c.status === 'active').length,
      closed: campaigns.filter((c) => c.status === 'closed').length,
      completed: campaigns.filter((c) => c.status === 'completed').length,
    },
    collaborationStats: {
      total: collabs.length,
      active: collabs.filter((c) => c.status === 'active').length,
      completed: collabs.filter((c) => c.status === 'completed').length,
    },
    partners,
    complaints: { by: complaintsBy, against: complaintsAgainst },
    reviews,
    payments,
  });
});

// GET /api/admin/inspect/creator/:id  (§30)
export const inspectCreator = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user || user.role !== 'creator') throw ApiError.notFound('Creator not found');
  const profile = await CreatorProfile.findOne({ user: user._id }).lean();

  const collabs = await Collaboration.find({ creator: user._id })
    .populate('company', 'name role email status isAdminVerified')
    .populate('campaign', 'title')
    .sort('-createdAt')
    .lean();

  // §30 — "Companies collaborated with" + logos, each clickable
  const companyIds = [...new Set(collabs.map((c) => String(c.company?._id)).filter(Boolean))];
  const companyProfiles = await CompanyProfile.find({ user: { $in: companyIds } })
    .select('user logoUrl industry')
    .lean();
  const logoMap = Object.fromEntries(companyProfiles.map((p) => [String(p.user), p.logoUrl]));

  const partners = companyIds.map((id) => {
    const mine = collabs.filter((c) => String(c.company?._id) === id);
    return {
      ...card(mine[0].company, { logoUrl: logoMap[id] }),
      collaborations: mine.length,
      active: mine.filter((c) => c.status === 'active').length,
      completed: mine.filter((c) => c.status === 'completed').length,
      campaigns: mine.map((c) => ({ _id: c.campaign?._id, title: c.campaign?.title, status: c.status })),
    };
  });

  const [applications, complaintsBy, complaintsAgainst, reviews, history, payments] =
    await Promise.all([
      Application.find({ creator: user._id })
        .populate('campaign', 'title status')
        .sort('-createdAt')
        .lean(),
      Complaint.find({ reporter: user._id })
        .populate('targetUser', 'name role')
        .populate('targetCampaign', 'title')
        .sort('-createdAt')
        .lean(),
      Complaint.find({ targetUser: user._id })
        .populate('reporter', 'name role')
        .sort('-createdAt')
        .lean(),
      Review.find({ $or: [{ author: user._id }, { subject: user._id }] })
        .populate('author', 'name role')
        .populate('subject', 'name role')
        .sort('-createdAt')
        .lean(),
      // §30 — previous ranks + highest achievement
      MonthlyRanking.find({ user: user._id }).sort('-period').lean(),
      SubscriptionPayment.find({ user: user._id }).sort('-createdAt').lean(),
    ]);

  res.json({
    success: true,
    user: card(user, profile),
    profile, // platforms, followers, portfolio — unmasked for admins only
    accountStatus: { status: user.status, verified: user.isAdminVerified, deletedAt: user.deletedAt },
    subscription: user.subscription || null,
    quota: await quotaFor(user, 'creator'),
    ranking: await rankingProfile(user._id, 'creator'),
    rankHistory: history,
    collaborationStats: {
      total: collabs.length,
      active: collabs.filter((c) => c.status === 'active').length,
      completed: collabs.filter((c) => c.status === 'completed').length,
    },
    partners,
    applications,
    complaints: { by: complaintsBy, against: complaintsAgainst },
    reviews,
    payments,
  });
});

// GET /api/admin/inspect/campaign/:id  (§31)
export const inspectCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id)
    .populate('company', 'name role email status isAdminVerified')
    .lean();
  if (!campaign) throw ApiError.notFound('Campaign not found');

  const companyProfile = await CompanyProfile.findOne({ user: campaign.company?._id }).lean();

  const applications = await Application.find({ campaign: campaign._id })
    .populate('creator', 'name role email status isAdminVerified')
    .sort('-createdAt')
    .lean();

  const creatorIds = applications.map((a) => a.creator?._id).filter(Boolean);
  const creatorProfiles = await CreatorProfile.find({ user: { $in: creatorIds } })
    .select('user avatarUrl')
    .lean();
  const avatarMap = Object.fromEntries(creatorProfiles.map((p) => [String(p.user), p.avatarUrl]));

  const withAvatars = applications.map((a) => ({
    ...a,
    creator: card(a.creator, { avatarUrl: avatarMap[String(a.creator?._id)] }),
  }));

  const collaborations = await Collaboration.find({ campaign: campaign._id })
    .populate('creator', 'name role email status')
    .sort('-createdAt')
    .lean();

  const complaints = await Complaint.find({ targetCampaign: campaign._id })
    .populate('reporter', 'name role')
    .populate('targetUser', 'name role')
    .sort('-createdAt')
    .lean();

  res.json({
    success: true,
    campaign,
    company: { ...card(campaign.company, companyProfile), profile: companyProfile },
    applications: withAvatars,
    applicationStats: {
      total: applications.length,
      pending: applications.filter((a) => a.status === 'pending').length,
      accepted: applications.filter((a) => a.status === 'accepted').length,
      rejected: applications.filter((a) => a.status === 'rejected').length,
    },
    collaborations: collaborations.map((c) => ({
      ...c,
      creator: card(c.creator, { avatarUrl: avatarMap[String(c.creator?._id)] }),
    })),
    complaints,
  });
});
