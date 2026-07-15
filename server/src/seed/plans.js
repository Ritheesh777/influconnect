import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { Coupon } from '../models/Coupon.js';

/**
 * Seeds subscription plans + a launch coupon (v2 §8, §12).
 * Safe to re-run: upserts by code, never wipes.
 *   npm run seed:plans
 */
const PLANS = [
  {
    code: 'creator-monthly',
    name: 'Creator Monthly',
    audience: 'creator',
    pricePaise: 49900, // ₹499
    interval: 'monthly',
    collabLimit: null, // unlimited while active
    features: [
      'Unlimited collaborations',
      'Priority in creator search',
      'Full portfolio & media kit',
      'Rank & trophy progression',
    ],
    sortOrder: 1,
  },
  {
    code: 'company-monthly',
    name: 'Company Monthly',
    audience: 'company',
    pricePaise: 199900, // ₹1,999
    interval: 'monthly',
    collabLimit: null,
    features: [
      'Unlimited creator collaborations',
      'Unlimited campaigns',
      'Advanced creator search filters',
      'Featured campaign placement',
    ],
    sortOrder: 1,
  },
];

const COUPONS = [
  {
    code: 'LAUNCH80',
    description: 'Launch promotion — 80% off',
    type: 'percent',
    value: 80,
    audience: 'all',
    perUserLimit: 1,
    usageLimit: 500,
    isActive: true,
  },
  {
    code: 'FLAT100',
    description: '₹100 off any plan',
    type: 'fixed',
    value: 10000, // paise
    audience: 'all',
    perUserLimit: 1,
    isActive: true,
  },
];

async function run() {
  await connectDB();
  for (const p of PLANS) {
    await SubscriptionPlan.findOneAndUpdate({ code: p.code }, p, { upsert: true, new: true });
    console.log(`  ✓ plan   ${p.code.padEnd(18)} ₹${(p.pricePaise / 100).toFixed(0)}/${p.interval}`);
  }
  for (const c of COUPONS) {
    await Coupon.findOneAndUpdate({ code: c.code }, c, { upsert: true, new: true });
    console.log(`  ✓ coupon ${c.code.padEnd(18)} ${c.type === 'percent' ? c.value + '%' : '₹' + c.value / 100} off`);
  }
  console.log('✅ Plans & coupons ready.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error('Plan seed failed:', e);
  process.exit(1);
});
