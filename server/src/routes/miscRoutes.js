import { Router } from 'express';
import { z } from 'zod';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import * as saved from '../controllers/savedController.js';
import * as collab from '../controllers/collaborationController.js';
import * as complaint from '../controllers/complaintController.js';
import * as publicC from '../controllers/publicController.js';
import * as media from '../controllers/mediaController.js';
import * as ranking from '../controllers/rankingController.js';

// ── Saved campaigns (creator) ─────────────────────────
export const savedRouter = Router();
savedRouter.get('/', protect, authorize('creator'), saved.getSaved);
savedRouter.post('/:campaignId', protect, authorize('creator'), saved.toggleSaved);

// ── Collaborations ────────────────────────────────────
export const collabRouter = Router();
collabRouter.get('/', protect, collab.getMyCollaborations);
collabRouter.patch('/:id/complete', protect, collab.completeCollaboration);

// ── Complaints ────────────────────────────────────────
export const complaintRouter = Router();
complaintRouter.post(
  '/',
  protect,
  validate(
    z.object({
      targetType: z.enum(['user', 'campaign', 'message']),
      targetUser: z.string().optional(),
      targetCampaign: z.string().optional(),
      reason: z.string().min(3),
      description: z.string().optional(),
      evidence: z.array(z.string()).optional(),
    })
  ),
  complaint.createComplaint
);
complaintRouter.get('/mine', protect, complaint.getMyComplaints);

// ── Media uploads ─────────────────────────────────────
export const mediaRouter = Router();
mediaRouter.post('/', protect, upload.single('file'), media.uploadSingle);
mediaRouter.post('/multiple', protect, upload.array('files', 10), media.uploadMultiple);

// ── Public ────────────────────────────────────────────
export const publicRouter = Router();
publicRouter.post(
  '/contact',
  validate(z.object({ name: z.string().min(2), email: z.string().email(), message: z.string().min(5) })),
  publicC.submitContact
);
publicRouter.get('/stats', publicC.getPublicStats);

// ── Ranking & trophies (§13–§16) ──────────────────────
export const rankingRouter = Router();
rankingRouter.get('/me', protect, ranking.myRanking);
rankingRouter.get('/leaderboard', protect, ranking.leaderboard);
rankingRouter.get('/user/:id', protect, ranking.userRanking);
