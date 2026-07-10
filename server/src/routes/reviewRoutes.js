import { Router } from 'express';
import { z } from 'zod';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as review from '../controllers/reviewController.js';

const router = Router();

router.post(
  '/',
  protect,
  validate(
    z.object({
      collaborationId: z.string(),
      rating: z.number().int().min(1).max(5),
      comment: z.string().max(1000).optional(),
    })
  ),
  review.createReview
);
router.get('/mine', protect, review.getMyReviews);
router.get('/user/:userId', review.getReviewsForUser);

export default router;
