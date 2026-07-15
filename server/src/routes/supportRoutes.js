import { Router } from 'express';
import { z } from 'zod';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import * as support from '../controllers/supportController.js';

const router = Router();

// §33 — support contact details and FAQ are public: someone who cannot log in
// is exactly the person who most needs to reach support.
router.get('/info', support.getSupportInfo);

router.post(
  '/tickets',
  protect,
  validate(
    z.object({
      category: z.enum(['technical', 'subscription', 'payment', 'account', 'campaign', 'other']).optional(),
      subject: z.string().min(3).max(150),
      message: z.string().min(10).max(4000),
      attachments: z.array(z.object({ url: z.string(), name: z.string(), type: z.string() })).optional(),
    })
  ),
  support.createTicket
);
router.get('/tickets', protect, support.myTickets);

// §34 — admins are excluded in the controller; they must not delete themselves.
router.delete(
  '/account',
  protect,
  authorize('company', 'creator'),
  validate(z.object({ password: z.string().min(1), confirm: z.string() })),
  support.deleteAccount
);

export default router;
