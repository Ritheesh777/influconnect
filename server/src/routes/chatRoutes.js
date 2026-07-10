import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import * as chat from '../controllers/chatController.js';

const router = Router();

router.get('/conversations', protect, chat.getConversations);
router.get('/conversations/:id/messages', protect, chat.getMessages);
router.post('/conversations/:id/messages', protect, chat.sendMessage);

export default router;
