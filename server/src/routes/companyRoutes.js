import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { upload } from '../middleware/upload.js';
import * as company from '../controllers/companyController.js';

const router = Router();

router.get('/me', protect, authorize('company'), company.getMyProfile);
router.put('/me', protect, authorize('company'), company.updateMyProfile);
router.patch(
  '/me/media',
  protect,
  authorize('company'),
  upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]),
  company.updateMedia
);
router.get('/dashboard', protect, authorize('company'), company.getDashboard);
router.get('/:id', company.getPublicCompany);

export default router;
