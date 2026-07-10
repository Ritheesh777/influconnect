import { Router } from 'express';
import { z } from 'zod';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import * as admin from '../controllers/adminController.js';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', admin.getDashboard);

router.get('/users', admin.listUsers);
router.get('/users/:id', admin.getUser);
router.patch(
  '/users/:id/status',
  validate(z.object({ status: z.enum(['active', 'suspended', 'banned']) })),
  admin.setUserStatus
);
router.patch(
  '/users/:id/verify',
  validate(z.object({ verified: z.boolean() })),
  admin.setUserVerified
);
router.delete('/users/:id', admin.deleteUser);

router.get('/campaigns', admin.listCampaigns);
router.patch('/campaigns/:id/moderation', admin.moderateCampaign);

router.get('/complaints', admin.listComplaints);
router.patch('/complaints/:id', admin.resolveComplaint);

export default router;
