import { asyncHandler } from '../utils/asyncHandler.js';
import { SavedCampaign } from '../models/SavedCampaign.js';

// POST /api/saved/:campaignId  (toggle)
export const toggleSaved = asyncHandler(async (req, res) => {
  const existing = await SavedCampaign.findOne({
    creator: req.user._id,
    campaign: req.params.campaignId,
  });
  if (existing) {
    await existing.deleteOne();
    return res.json({ success: true, saved: false });
  }
  await SavedCampaign.create({ creator: req.user._id, campaign: req.params.campaignId });
  res.json({ success: true, saved: true });
});

// GET /api/saved
export const getSaved = asyncHandler(async (req, res) => {
  const items = await SavedCampaign.find({ creator: req.user._id })
    .sort('-createdAt')
    .populate({
      path: 'campaign',
      populate: { path: 'companyProfile', select: 'companyName logoUrl city country' },
    })
    .lean();
  res.json({ success: true, items: items.filter((i) => i.campaign) });
});
