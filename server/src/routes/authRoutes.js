import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import * as auth from '../controllers/authController.js';
import { INDUSTRIES } from '../models/CompanyProfile.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

const password = z.string().min(8, 'Password must be at least 8 characters');

const companySchema = z
  .object({
    companyName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(6).optional().or(z.literal('')),
    password,
    confirmPassword: password,
    industry: z.enum(INDUSTRIES).optional(),
    city: z.string().optional().default(''),
    state: z.string().optional().default(''),
    country: z.string().optional().default(''),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const creatorSchema = z
  .object({
    fullName: z.string().min(2),
    username: z
      .string()
      .min(3)
      .regex(/^[a-zA-Z0-9_.]+$/, 'Letters, numbers, _ and . only'),
    email: z.string().email(),
    phone: z.string().min(6).optional().or(z.literal('')),
    password,
    confirmPassword: password,
    city: z.string().optional().default(''),
    state: z.string().optional().default(''),
    country: z.string().optional().default(''),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(['company', 'creator', 'admin']).optional(),
});

router.post('/register/company', authLimiter, validate(companySchema), auth.registerCompany);
router.post('/register/creator', authLimiter, validate(creatorSchema), auth.registerCreator);
router.post('/login', authLimiter, validate(loginSchema), auth.login);

router.post('/verify-email', validate(z.object({ token: z.string() })), auth.verifyEmail);
router.post('/resend-verification', protect, auth.resendVerification);
router.post(
  '/forgot-password',
  authLimiter,
  validate(z.object({ email: z.string().email() })),
  auth.forgotPassword
);
router.post(
  '/reset-password',
  validate(z.object({ token: z.string(), password })),
  auth.resetPassword
);
router.patch(
  '/change-password',
  protect,
  validate(z.object({ currentPassword: z.string(), newPassword: password })),
  auth.changePassword
);

router.get('/me', protect, auth.getMe);

export default router;
