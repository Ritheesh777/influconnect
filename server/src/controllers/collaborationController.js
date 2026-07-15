import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { Collaboration } from '../models/Collaboration.js';
import { notify } from '../utils/notify.js';
import { snapshotRanking } from '../utils/ranking.js';

// GET /api/collaborations  (mine — either side)
export const getMyCollaborations = asyncHandler(async (req, res) => {
  const filter = { $or: [{ company: req.user._id }, { creator: req.user._id }] };
  if (req.query.status) filter.status = req.query.status;
  const items = await Collaboration.find(filter)
    .sort('-createdAt')
    .populate('campaign', 'title')
    .populate('company', 'name')
    .populate('creator', 'name')
    .lean();
  res.json({ success: true, items });
});

// PATCH /api/collaborations/:id/complete  (either party marks complete)
export const completeCollaboration = asyncHandler(async (req, res) => {
  const collab = await Collaboration.findById(req.params.id).populate('campaign', 'title');
  if (!collab) throw ApiError.notFound('Collaboration not found');
  const isParty =
    String(collab.company) === String(req.user._id) ||
    String(collab.creator) === String(req.user._id);
  if (!isParty) throw ApiError.forbidden();
  if (collab.status === 'cancelled') throw ApiError.badRequest('Collaboration was cancelled');

  collab.status = 'completed';
  collab.completedAt = new Date();
  await collab.save();

  // §14 — snapshot each side's monthly rank. The live counter resets each month
  // but these rows persist, so history is never lost (BR-NEW-011).
  await Promise.all([
    snapshotRanking(collab.company, 'company'),
    snapshotRanking(collab.creator, 'creator'),
  ]);

  const other =
    String(collab.company) === String(req.user._id) ? collab.creator : collab.company;
  await notify({
    user: other,
    type: 'application_accepted',
    title: 'Collaboration marked complete',
    body: `"${collab.campaign.title}" was marked complete. You can now leave a review.`,
    link: '/reviews',
  });

  res.json({ success: true, collaboration: collab });
});
