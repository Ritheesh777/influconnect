import { Router } from 'express';
import { z } from 'zod';
import { protect, optionalAuth } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import * as campaign from '../controllers/campaignController.js';
import {
  CAMPAIGN_CATEGORIES,
  CAMPAIGN_TYPES,
  FOLLOWER_RANGES,
} from '../models/Campaign.js';

const router = Router();

const campaignSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.enum(CAMPAIGN_CATEGORIES).optional(),
  campaignType: z.enum(CAMPAIGN_TYPES).optional(),
  platforms: z.array(z.enum(['instagram', 'youtube', 'tiktok', 'facebook'])).optional(),
  followerRange: z.enum(FOLLOWER_RANGES).optional(),
  minEngagementRate: z.number().min(0).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  isWorldwide: z.boolean().optional(),
  creatorsNeeded: z.number().int().min(1).optional(),
  deadline: z.coerce.date().optional(),
  terms: z.string().optional(),
  status: z.enum(['draft', 'active']).optional(),
});

// Public / browse
router.get('/', optionalAuth, campaign.browseCampaigns);
router.get('/featured', campaign.getFeatured);
router.get('/mine', protect, authorize('company'), campaign.getMyCampaigns);
router.get('/:id', optionalAuth, campaign.getCampaign);
router.get('/:id/applications', protect, authorize('company'), campaign.getCampaignApplications);

// Company CRUD
router.post('/', protect, authorize('company'), validate(campaignSchema), campaign.createCampaign);
router.put('/:id', protect, authorize('company'), campaign.updateCampaign);
router.patch(
  '/:id/status',
  protect,
  authorize('company'),
  validate(z.object({ status: z.enum(['draft', 'active', 'paused', 'closed', 'completed']) })),
  campaign.setStatus
);
router.post(
  '/:id/media',
  protect,
  authorize('company'),
  upload.fields([{ name: 'banner', maxCount: 1 }, { name: 'images', maxCount: 8 }]),
  campaign.uploadCampaignMedia
);
router.delete('/:id', protect, authorize('company'), campaign.deleteCampaign);

export default router;
