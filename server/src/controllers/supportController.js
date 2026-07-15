import bcrypt from 'bcryptjs';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { PlatformSettings } from '../models/PlatformSettings.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { User } from '../models/User.js';
import { CompanyProfile } from '../models/CompanyProfile.js';
import { CreatorProfile } from '../models/CreatorProfile.js';
import { Campaign } from '../models/Campaign.js';
import { Application } from '../models/Application.js';
import { Collaboration } from '../models/Collaboration.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';

// GET /api/support/info — public support details + FAQ (§33)
export const getSupportInfo = asyncHandler(async (req, res) => {
  const s = await PlatformSettings.get();
  res.json({
    success: true,
    support: {
      email: s.support.email,
      helpline: s.support.helpline,
      hours: s.support.hours,
      responseTime: s.support.responseTime,
      faqs: s.support.faqs,
    },
  });
});

// POST /api/support/tickets — report a problem (§33)
export const createTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.create({
    user: req.user._id,
    category: req.body.category || 'other',
    subject: req.body.subject,
    message: req.body.message,
    attachments: req.body.attachments || [],
  });
  res.status(201).json({ success: true, ticket });
});

// GET /api/support/tickets — my tickets
export const myTickets = asyncHandler(async (req, res) => {
  const items = await SupportTicket.find({ user: req.user._id }).sort('-createdAt').lean();
  res.json({ success: true, items });
});

/**
 * DELETE /api/support/account — account deletion (§34).
 *
 * Requires the current password (§34: "password verification or secure
 * re-authentication"). This is a *deactivation + anonymisation*, not a purge:
 * §34 explicitly warns that "critical audit and financial/subscription records
 * should not be blindly deleted if retention is legally or operationally
 * required". So we keep collaborations, reviews, complaints and subscription
 * payments — they are the other party's record too, and ours for tax/audit —
 * and strip the personal data that identifies this user.
 */
export const deleteAccount = asyncHandler(async (req, res) => {
  const { password, confirm } = req.body;
  if (confirm !== 'DELETE')
    throw ApiError.badRequest('Type DELETE to confirm account deletion.');

  const user = await User.findById(req.user._id).select('+password');
  if (!user) throw ApiError.notFound('Account not found');
  if (user.role === 'admin') throw ApiError.forbidden('Administrator accounts cannot be self-deleted.');

  const ok = await bcrypt.compare(password || '', user.password);
  if (!ok) throw ApiError.unauthorized('That password is incorrect.');

  // Refuse while money or obligations are outstanding — deleting mid-collaboration
  // would strand the other party with no counterparty and no chat.
  const active = await Collaboration.countDocuments({
    $or: [{ company: user._id }, { creator: user._id }],
    status: 'active',
  });
  if (active > 0)
    throw ApiError.badRequest(
      `You have ${active} active collaboration${active > 1 ? 's' : ''}. Complete or cancel ${
        active > 1 ? 'them' : 'it'
      } before deleting your account.`
    );

  const stamp = Date.now();
  const anon = `deleted_${stamp}_${String(user._id).slice(-6)}`;

  // Anonymise the identity but keep the row: foreign keys in collaborations,
  // reviews and payments must still resolve, or an admin audit would break.
  user.name = 'Deleted user';
  user.email = `${anon}@deleted.invalid`;
  user.phone = '';
  // Randomising the password severs any session-independent way back in, and
  // status:'deleted' trips the existing login guard.
  user.password = await bcrypt.hash(`${anon}-${Math.random()}`, 10);
  user.status = 'deleted';
  user.deletedAt = new Date();
  user.isVerified = false;
  user.isAdminVerified = false;
  await user.save();

  // Profiles hold the bulk of the personal data — remove them outright.
  if (user.role === 'company') {
    await CompanyProfile.deleteOne({ user: user._id });
    // Unpublish their campaigns so creators stop seeing dead listings.
    await Campaign.updateMany({ company: user._id, status: 'active' }, { status: 'closed' });
  } else {
    await CreatorProfile.deleteOne({ user: user._id });
    // Withdraw anything still pending; companies shouldn't accept a ghost.
    await Application.updateMany(
      { creator: user._id, status: 'pending' },
      { status: 'withdrawn' }
    );
  }

  // Chat: clear the personal content, keep the thread skeleton for audit.
  const convos = await Conversation.find({ participants: user._id }).select('_id').lean();
  await Message.updateMany(
    { conversation: { $in: convos.map((c) => c._id) }, sender: user._id },
    { $set: { body: '[message removed — account deleted]', attachments: [] } }
  );

  res.json({
    success: true,
    message: 'Your account has been deleted.',
    retained:
      'Collaboration, review and subscription payment records are kept in anonymised form for audit and for the other party.',
  });
});
