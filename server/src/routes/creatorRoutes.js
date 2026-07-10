import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { upload } from '../middleware/upload.js';
import * as creator from '../controllers/creatorController.js';

const router = Router();

// Company-facing creator search
router.get('/', protect, authorize('company', 'admin'), creator.searchCreators);

router.get('/me', protect, authorize('creator'), creator.getMyProfile);
router.put('/me', protect, authorize('creator'), creator.updateMyProfile);
router.patch('/me/avatar', protect, authorize('creator'), upload.single('avatar'), creator.updateAvatar);
router.put('/me/socials', protect, authorize('creator'), creator.updateSocials);
router.post(
  '/me/portfolio',
  protect,
  authorize('creator'),
  upload.array('files', 8),
  creator.addPortfolioItems
);
router.delete('/me/portfolio/:itemId', protect, authorize('creator'), creator.removePortfolioItem);
router.patch('/me/media-kit', protect, authorize('creator'), upload.single('file'), creator.updateMediaKit);
router.get('/dashboard', protect, authorize('creator'), creator.getDashboard);

router.get('/:id', protect, creator.getPublicCreator);

export default router;
