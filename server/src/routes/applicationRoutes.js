import { Router } from 'express';
import { z } from 'zod';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import * as app from '../controllers/applicationController.js';

const router = Router();

router.post(
  '/',
  protect,
  authorize('creator'),
  validate(
    z.object({
      campaignId: z.string(),
      message: z.string().optional(),
      portfolioSnapshot: z.array(z.string()).optional(),
    })
  ),
  app.applyToCampaign
);

router.post(
  '/invite',
  protect,
  authorize('company'),
  validate(z.object({ campaignId: z.string(), creatorId: z.string(), message: z.string().optional() })),
  app.inviteCreator
);

router.get('/mine', protect, authorize('creator'), app.getMyApplications);
router.get('/received', protect, authorize('company'), app.getReceivedApplications);

router.patch(
  '/:id/decision',
  protect,
  authorize('company'),
  validate(z.object({ decision: z.enum(['accepted', 'rejected']) })),
  app.decideApplication
);
router.patch(
  '/:id/respond-invite',
  protect,
  authorize('creator'),
  validate(z.object({ accept: z.boolean() })),
  app.respondToInvitation
);
router.patch('/:id/withdraw', protect, authorize('creator'), app.withdrawApplication);

export default router;
