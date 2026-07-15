import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import * as chat from '../controllers/chatController.js';

const router = Router();

// Block list routes are declared before '/:id' style paths so 'block' is never
// swallowed as an id.
router.get('/block', protect, chat.listBlocked);
router.post('/block', protect, chat.blockUser);
router.delete('/block/:userId', protect, chat.unblockUser);

router.get('/conversations', protect, chat.getConversations);
router.get('/conversations/:id/messages', protect, chat.getMessages);
router.post('/conversations/:id/messages', protect, chat.sendMessage);
router.patch('/conversations/:id/prefs', protect, chat.updateConversationPrefs);
router.delete('/conversations/:id', protect, chat.deleteConversation);

router.post('/messages/:id/view', protect, chat.viewOnceMedia);
router.delete('/messages/:id', protect, chat.deleteMessage);

export default router;
