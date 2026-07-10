import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import * as notif from '../controllers/notificationController.js';

const router = Router();

router.get('/', protect, notif.getNotifications);
router.patch('/read-all', protect, notif.markAllRead);
router.patch('/preferences', protect, notif.updatePreferences);
router.patch('/:id/read', protect, notif.markRead);
router.delete('/', protect, notif.clearAll);

export default router;
