import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { Complaint } from '../models/Complaint.js';

// POST /api/complaints  { targetType, targetUser?, targetCampaign?, reason, description, evidence }
export const createComplaint = asyncHandler(async (req, res) => {
  const { targetType, targetUser, targetCampaign, reason, description = '', evidence = [] } =
    req.body;
  if (targetType === 'user' && !targetUser) throw ApiError.badRequest('targetUser is required');
  if (targetType === 'campaign' && !targetCampaign)
    throw ApiError.badRequest('targetCampaign is required');

  const complaint = await Complaint.create({
    reporter: req.user._id,
    targetType,
    targetUser,
    targetCampaign,
    reason,
    description,
    evidence,
  });
  res.status(201).json({ success: true, complaint });
});

// GET /api/complaints/mine
export const getMyComplaints = asyncHandler(async (req, res) => {
  const items = await Complaint.find({ reporter: req.user._id }).sort('-createdAt').lean();
  res.json({ success: true, items });
});
