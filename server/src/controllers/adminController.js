import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/User.js';
import { Campaign } from '../models/Campaign.js';
import { Complaint } from '../models/Complaint.js';
import { CompanyProfile } from '../models/CompanyProfile.js';
import { CreatorProfile } from '../models/CreatorProfile.js';
import { Collaboration } from '../models/Collaboration.js';
import { notify } from '../utils/notify.js';

// GET /api/admin/dashboard
export const getDashboard = asyncHandler(async (_req, res) => {
  const [totalUsers, companies, creators, campaigns, openComplaints, collaborations] =
    await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: 'company' }),
      User.countDocuments({ role: 'creator' }),
      Campaign.countDocuments(),
      Complaint.countDocuments({ status: { $in: ['open', 'reviewing'] } }),
      Collaboration.countDocuments(),
    ]);
  const recentUsers = await User.find({ role: { $ne: 'admin' } })
    .sort('-createdAt')
    .limit(8)
    .select('name email role status createdAt')
    .lean();
  res.json({
    success: true,
    stats: { totalUsers, companies, creators, campaigns, openComplaints, collaborations },
    recentUsers,
  });
});

// GET /api/admin/users
export const listUsers = asyncHandler(async (req, res) => {
  const { role, status, q, page = 1, limit = 20 } = req.query;
  const filter = { role: { $ne: 'admin' } };
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)).select('-password').lean(),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, items, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// GET /api/admin/users/:id
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password').lean();
  if (!user) throw ApiError.notFound('User not found');
  const profile =
    user.role === 'company'
      ? await CompanyProfile.findOne({ user: user._id }).lean()
      : await CreatorProfile.findOne({ user: user._id }).lean();
  res.json({ success: true, user, profile });
});

// PATCH /api/admin/users/:id/status  { status } (active|suspended|banned)
export const setUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  ).select('-password');
  if (!user) throw ApiError.notFound('User not found');
  await notify({
    user: user._id,
    type: 'account_status',
    title: `Account ${req.body.status}`,
    body: `Your account status was changed to "${req.body.status}" by an administrator.`,
  });
  res.json({ success: true, user });
});

// PATCH /api/admin/users/:id/verify  { verified } (trust badge / fake-follower check)
export const setUserVerified = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isAdminVerified: Boolean(req.body.verified) },
    { new: true }
  ).select('-password');
  if (!user) throw ApiError.notFound('User not found');
  res.json({ success: true, user });
});

// DELETE /api/admin/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  await user.deleteOne();
  await CompanyProfile.deleteOne({ user: user._id });
  await CreatorProfile.deleteOne({ user: user._id });
  res.json({ success: true, message: 'User deleted' });
});

// GET /api/admin/campaigns
export const listCampaigns = asyncHandler(async (req, res) => {
  const { status, moderation, q, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (moderation) filter.moderation = moderation;
  if (q) filter.title = new RegExp(q, 'i');
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Campaign.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .populate('companyProfile', 'companyName')
      .lean(),
    Campaign.countDocuments(filter),
  ]);
  res.json({ success: true, items, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// PATCH /api/admin/campaigns/:id/moderation  { moderation, isFeatured? }
export const moderateCampaign = asyncHandler(async (req, res) => {
  const update = {};
  if ('moderation' in req.body) update.moderation = req.body.moderation;
  if ('isFeatured' in req.body) update.isFeatured = req.body.isFeatured;
  const campaign = await Campaign.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!campaign) throw ApiError.notFound('Campaign not found');
  res.json({ success: true, campaign });
});

// GET /api/admin/complaints
export const listComplaints = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const items = await Complaint.find(filter)
    .sort('-createdAt')
    .populate('reporter', 'name email role')
    .populate('targetUser', 'name email role status')
    .populate('targetCampaign', 'title')
    .lean();
  res.json({ success: true, items });
});

// PATCH /api/admin/complaints/:id  { status, resolutionNote }
export const resolveComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw ApiError.notFound('Complaint not found');
  if ('status' in req.body) complaint.status = req.body.status;
  if ('resolutionNote' in req.body) complaint.resolutionNote = req.body.resolutionNote;
  if (['resolved', 'dismissed'].includes(req.body.status)) {
    complaint.resolvedBy = req.user._id;
    complaint.resolvedAt = new Date();
  }
  await complaint.save();
  await notify({
    user: complaint.reporter,
    type: 'complaint_update',
    title: 'Update on your report',
    body: `Your report is now "${complaint.status}".`,
    link: '/settings',
  });
  res.json({ success: true, complaint });
});
