import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { Application } from '../models/Application.js';
import { Campaign } from '../models/Campaign.js';
import { Collaboration } from '../models/Collaboration.js';
import { Conversation } from '../models/Conversation.js';
import { notify } from '../utils/notify.js';

/** Finds or creates the conversation between company & creator for a campaign. */
async function ensureConversation({ campaign, company, creator, application }) {
  let convo = await Conversation.findOne({
    campaign,
    participants: { $all: [company, creator] },
  });
  if (!convo) {
    convo = await Conversation.create({
      campaign,
      application,
      participants: [company, creator],
      unread: {},
    });
  }
  return convo;
}

// POST /api/applications  (creator applies) { campaignId, message, portfolioSnapshot }
export const applyToCampaign = asyncHandler(async (req, res) => {
  const { campaignId, message = '', portfolioSnapshot = [] } = req.body;
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) throw ApiError.notFound('Campaign not found');
  if (campaign.status !== 'active') throw ApiError.badRequest('Campaign is not accepting applications');

  const existing = await Application.findOne({ campaign: campaignId, creator: req.user._id });
  if (existing && existing.status !== 'withdrawn')
    throw ApiError.conflict('You have already applied to this campaign');

  let application;
  if (existing) {
    existing.status = 'pending';
    existing.message = message;
    existing.portfolioSnapshot = portfolioSnapshot;
    existing.origin = 'application';
    application = await existing.save();
  } else {
    application = await Application.create({
      campaign: campaignId,
      company: campaign.company,
      creator: req.user._id,
      origin: 'application',
      message,
      portfolioSnapshot,
    });
    await Campaign.updateOne({ _id: campaignId }, { $inc: { applicationsCount: 1 } });
  }

  // Business rule: chat unlocks once an application is submitted
  await ensureConversation({
    campaign: campaign._id,
    company: campaign.company,
    creator: req.user._id,
    application: application._id,
  });

  await notify({
    user: campaign.company,
    type: 'application_received',
    title: 'New application received',
    body: `${req.user.name} applied to "${campaign.title}"`,
    link: `/company/campaigns/${campaign._id}/applications`,
    meta: { campaignId: campaign._id, applicationId: application._id },
  });

  res.status(201).json({ success: true, application });
});

// POST /api/applications/invite  (company invites creator) { campaignId, creatorId, message }
export const inviteCreator = asyncHandler(async (req, res) => {
  const { campaignId, creatorId, message = '' } = req.body;
  const campaign = await Campaign.findOne({ _id: campaignId, company: req.user._id });
  if (!campaign) throw ApiError.notFound('Campaign not found');

  const existing = await Application.findOne({ campaign: campaignId, creator: creatorId });
  if (existing && existing.status !== 'withdrawn')
    throw ApiError.conflict('This creator already has an application/invitation for this campaign');

  const application =
    existing ||
    (await Application.create({
      campaign: campaignId,
      company: req.user._id,
      creator: creatorId,
      origin: 'invitation',
      message,
    }));
  if (existing) {
    existing.status = 'pending';
    existing.origin = 'invitation';
    existing.message = message;
    await existing.save();
  }

  await ensureConversation({
    campaign: campaign._id,
    company: req.user._id,
    creator: creatorId,
    application: application._id,
  });

  await notify({
    user: creatorId,
    type: 'invitation_received',
    title: 'You have a campaign invitation',
    body: `${req.user.name} invited you to "${campaign.title}"`,
    link: `/creator/applications`,
    meta: { campaignId: campaign._id, applicationId: application._id },
  });

  res.status(201).json({ success: true, application });
});

// GET /api/applications/mine  (creator's own applications)
export const getMyApplications = asyncHandler(async (req, res) => {
  const filter = { creator: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  const items = await Application.find(filter)
    .sort('-createdAt')
    .populate({
      path: 'campaign',
      select: 'title status category deadline company',
      populate: { path: 'companyProfile', select: 'companyName logoUrl' },
    })
    .lean();
  res.json({ success: true, items });
});

// GET /api/applications/received  (company: all applications across campaigns)
export const getReceivedApplications = asyncHandler(async (req, res) => {
  const filter = { company: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  const items = await Application.find(filter)
    .sort('-createdAt')
    .populate('creator', 'name isAdminVerified')
    .populate('campaign', 'title')
    .lean();
  res.json({ success: true, items });
});

// PATCH /api/applications/:id/decision  { decision: accepted|rejected } (company)
export const decideApplication = asyncHandler(async (req, res) => {
  const { decision } = req.body;
  const application = await Application.findById(req.params.id).populate('campaign', 'title company');
  if (!application) throw ApiError.notFound('Application not found');
  if (String(application.company) !== String(req.user._id)) throw ApiError.forbidden();
  if (application.status !== 'pending')
    throw ApiError.badRequest(`Application already ${application.status}`);

  application.status = decision;
  application.respondedAt = new Date();
  await application.save();

  if (decision === 'accepted') {
    await Collaboration.create({
      campaign: application.campaign._id,
      application: application._id,
      company: application.company,
      creator: application.creator,
    });
    await Campaign.updateOne({ _id: application.campaign._id }, { $inc: { acceptedCount: 1 } });
  }

  await notify({
    user: application.creator,
    type: decision === 'accepted' ? 'application_accepted' : 'application_rejected',
    title: `Application ${decision}`,
    body: `Your application to "${application.campaign.title}" was ${decision}`,
    link: `/creator/applications`,
    meta: { campaignId: application.campaign._id },
  });

  res.json({ success: true, application });
});

// PATCH /api/applications/:id/respond-invite  { accept: bool } (creator)
export const respondToInvitation = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id).populate('campaign', 'title');
  if (!application) throw ApiError.notFound('Invitation not found');
  if (String(application.creator) !== String(req.user._id)) throw ApiError.forbidden();
  if (application.origin !== 'invitation' || application.status !== 'pending')
    throw ApiError.badRequest('No pending invitation to respond to');

  if (req.body.accept) {
    application.status = 'accepted';
    application.respondedAt = new Date();
    await application.save();
    await Collaboration.create({
      campaign: application.campaign._id,
      application: application._id,
      company: application.company,
      creator: application.creator,
    });
    await Campaign.updateOne({ _id: application.campaign._id }, { $inc: { acceptedCount: 1 } });
  } else {
    application.status = 'rejected';
    application.respondedAt = new Date();
    await application.save();
  }

  await notify({
    user: application.company,
    type: 'application_accepted',
    title: `Invitation ${application.status}`,
    body: `${req.user.name} ${application.status} your invitation to "${application.campaign.title}"`,
    link: `/company/campaigns/${application.campaign._id}/applications`,
  });

  res.json({ success: true, application });
});

// PATCH /api/applications/:id/withdraw  (creator)
export const withdrawApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) throw ApiError.notFound('Application not found');
  if (String(application.creator) !== String(req.user._id)) throw ApiError.forbidden();
  if (application.status !== 'pending')
    throw ApiError.badRequest('Only pending applications can be withdrawn');
  application.status = 'withdrawn';
  await application.save();
  await Campaign.updateOne(
    { _id: application.campaign, applicationsCount: { $gt: 0 } },
    { $inc: { applicationsCount: -1 } }
  );
  res.json({ success: true, application });
});
