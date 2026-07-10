import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { Review } from '../models/Review.js';
import { Collaboration } from '../models/Collaboration.js';
import { CompanyProfile } from '../models/CompanyProfile.js';
import { CreatorProfile } from '../models/CreatorProfile.js';
import { notify } from '../utils/notify.js';

/** Recomputes and stores the average rating on the reviewed user's profile. */
async function recomputeRating(subjectId, subjectRole) {
  const agg = await Review.aggregate([
    { $match: { subject: subjectId } },
    { $group: { _id: '$subject', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = agg[0] || {};
  const rounded = Math.round(avg * 10) / 10;
  if (subjectRole === 'company')
    await CompanyProfile.updateOne({ user: subjectId }, { ratingAvg: rounded, ratingCount: count });
  else
    await CreatorProfile.updateOne({ user: subjectId }, { ratingAvg: rounded, ratingCount: count });
}

// POST /api/reviews  { collaborationId, rating, comment }
export const createReview = asyncHandler(async (req, res) => {
  const { collaborationId, rating, comment = '' } = req.body;
  const collab = await Collaboration.findById(collaborationId);
  if (!collab) throw ApiError.notFound('Collaboration not found');

  const isCompany = String(collab.company) === String(req.user._id);
  const isCreator = String(collab.creator) === String(req.user._id);
  if (!isCompany && !isCreator) throw ApiError.forbidden('Not part of this collaboration');
  if (collab.status !== 'completed')
    throw ApiError.badRequest('You can review only after the collaboration is completed');

  const subject = isCompany ? collab.creator : collab.company;
  const subjectRole = isCompany ? 'creator' : 'company';

  if (await Review.exists({ collaboration: collab._id, author: req.user._id }))
    throw ApiError.conflict('You already reviewed this collaboration');

  const review = await Review.create({
    collaboration: collab._id,
    campaign: collab.campaign,
    author: req.user._id,
    subject,
    authorRole: req.user.role,
    rating,
    comment,
  });

  if (isCompany) collab.companyReviewed = true;
  else collab.creatorReviewed = true;
  await collab.save();

  await recomputeRating(subject, subjectRole);
  await notify({
    user: subject,
    type: 'review_received',
    title: 'You received a review',
    body: `${req.user.name} rated you ${rating}★`,
    link: subjectRole === 'company' ? '/company/profile' : '/creator/profile',
  });

  res.status(201).json({ success: true, review });
});

// GET /api/reviews/user/:userId
export const getReviewsForUser = asyncHandler(async (req, res) => {
  const items = await Review.find({ subject: req.params.userId })
    .sort('-createdAt')
    .populate('author', 'name role')
    .lean();
  res.json({ success: true, items });
});

// GET /api/reviews/mine  (written by me + about me)
export const getMyReviews = asyncHandler(async (req, res) => {
  const [given, received] = await Promise.all([
    Review.find({ author: req.user._id }).sort('-createdAt').populate('subject', 'name role').lean(),
    Review.find({ subject: req.user._id })
      .sort('-createdAt')
      .populate('author', 'name role')
      .lean(),
  ]);
  res.json({ success: true, given, received });
});
