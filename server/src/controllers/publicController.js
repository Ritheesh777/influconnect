import { asyncHandler } from '../utils/asyncHandler.js';
import { ContactMessage } from '../models/ContactMessage.js';
import { User } from '../models/User.js';
import { Campaign } from '../models/Campaign.js';

// POST /api/public/contact  { name, email, message }
export const submitContact = asyncHandler(async (req, res) => {
  await ContactMessage.create(req.body);
  res.status(201).json({ success: true, message: 'Thanks! We will get back to you soon.' });
});

// GET /api/public/stats  (landing page social proof)
export const getPublicStats = asyncHandler(async (_req, res) => {
  const [companies, creators, campaigns] = await Promise.all([
    User.countDocuments({ role: 'company', status: 'active' }),
    User.countDocuments({ role: 'creator', status: 'active' }),
    Campaign.countDocuments({ status: 'active' }),
  ]);
  res.json({ success: true, stats: { companies, creators, campaigns } });
});
