import { Router } from 'express';
import { z } from 'zod';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import * as sub from '../controllers/subscriptionController.js';

const router = Router();

// Companies and creators can subscribe; admins have no plan.
const paying = authorize('company', 'creator');

router.get('/plans', protect, paying, sub.listPlans);
router.post(
  '/quote',
  protect,
  paying,
  validate(z.object({ planCode: z.string(), couponCode: z.string().optional().or(z.literal('')) })),
  sub.getQuote
);
router.post(
  '/checkout',
  protect,
  paying,
  validate(z.object({ planCode: z.string(), couponCode: z.string().optional().or(z.literal('')) })),
  sub.createCheckout
);
router.post(
  '/verify',
  protect,
  paying,
  validate(
    z.object({
      razorpay_order_id: z.string(),
      razorpay_payment_id: z.string(),
      razorpay_signature: z.string(),
    })
  ),
  sub.verifyPayment
);
router.get('/me', protect, paying, sub.mySubscription);

export default router;
