import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { signToken, generateVerificationToken, hashToken } from '../utils/token.js';
import { User } from '../models/User.js';
import { CompanyProfile } from '../models/CompanyProfile.js';
import { CreatorProfile } from '../models/CreatorProfile.js';

function authResponse(res, user, statusCode = 200) {
  const token = signToken({ id: user._id, role: user.role });
  res.status(statusCode).json({
    success: true,
    token,
    user: user.toSafeJSON ? user.toSafeJSON() : user,
  });
}

// POST /api/auth/register/company
export const registerCompany = asyncHandler(async (req, res) => {
  const { companyName, email, phone, password, industry, city, state, country } = req.body;

  if (await User.exists({ email })) throw ApiError.conflict('Email already registered');

  const user = await User.create({
    role: 'company',
    name: companyName,
    email,
    phone,
    password,
  });

  await CompanyProfile.create({
    user: user._id,
    companyName,
    industry,
    city,
    state,
    country,
  });

  // Email verification token (emailing wired later; token returned in dev)
  const { raw, hashed } = generateVerificationToken();
  user.emailVerificationToken = hashed;
  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  await user.save();

  authResponse(res, user, 201);
});

// POST /api/auth/register/creator
export const registerCreator = asyncHandler(async (req, res) => {
  const { fullName, username, email, phone, password, city, state, country } = req.body;

  if (await User.exists({ email })) throw ApiError.conflict('Email already registered');
  if (await CreatorProfile.exists({ username })) throw ApiError.conflict('Username already taken');

  const user = await User.create({
    role: 'creator',
    name: fullName,
    email,
    phone,
    password,
  });

  await CreatorProfile.create({
    user: user._id,
    fullName,
    username,
    city,
    state,
    country,
  });

  const { hashed } = generateVerificationToken();
  user.emailVerificationToken = hashed;
  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  await user.save();

  authResponse(res, user, 201);
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password)))
    throw ApiError.unauthorized('Invalid email or password');

  if (role && user.role !== role)
    throw ApiError.unauthorized(`This account is not a ${role} account`);
  if (user.status !== 'active') throw ApiError.forbidden(`Account ${user.status}`);

  user.lastLoginAt = new Date();
  await user.save();
  authResponse(res, user);
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  let profile = null;
  if (req.user.role === 'company') profile = await CompanyProfile.findOne({ user: req.user._id });
  if (req.user.role === 'creator') profile = await CreatorProfile.findOne({ user: req.user._id });
  res.json({ success: true, user: req.user, profile });
});

// POST /api/auth/verify-email  { token }
export const verifyEmail = asyncHandler(async (req, res) => {
  const hashed = hashToken(req.body.token || '');
  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: Date.now() },
  }).select('+emailVerificationToken +emailVerificationExpires');
  if (!user) throw ApiError.badRequest('Verification link is invalid or has expired');

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();
  res.json({ success: true, message: 'Email verified' });
});

// POST /api/auth/resend-verification (auth)
export const resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    '+emailVerificationToken +emailVerificationExpires'
  );
  if (user.isVerified) return res.json({ success: true, message: 'Already verified' });
  const { raw, hashed } = generateVerificationToken();
  user.emailVerificationToken = hashed;
  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  await user.save();
  // In dev, return the raw token so the flow is testable without email.
  res.json({ success: true, message: 'Verification sent', devToken: raw });
});

// POST /api/auth/forgot-password { email }
export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  // Always respond success to avoid email enumeration
  if (!user)
    return res.json({ success: true, message: 'If that email exists, a reset link was sent' });

  const { raw, hashed } = generateVerificationToken();
  user.passwordResetToken = hashed;
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000;
  await user.save();
  res.json({
    success: true,
    message: 'If that email exists, a reset link was sent',
    devToken: raw,
  });
});

// POST /api/auth/reset-password { token, password }
export const resetPassword = asyncHandler(async (req, res) => {
  const hashed = hashToken(req.body.token || '');
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');
  if (!user) throw ApiError.badRequest('Reset link is invalid or has expired');

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.json({ success: true, message: 'Password reset successful' });
});

// PATCH /api/auth/change-password { currentPassword, newPassword } (auth)
export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.currentPassword)))
    throw ApiError.badRequest('Current password is incorrect');
  user.password = req.body.newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed' });
});
