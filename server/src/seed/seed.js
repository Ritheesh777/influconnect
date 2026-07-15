import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { CompanyProfile } from '../models/CompanyProfile.js';
import { CreatorProfile } from '../models/CreatorProfile.js';
import { Campaign } from '../models/Campaign.js';
import { Application } from '../models/Application.js';
import { Collaboration } from '../models/Collaboration.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { Review } from '../models/Review.js';
import { MonthlyRanking } from '../models/MonthlyRanking.js';
import { snapshotRanking, periodKey } from '../utils/ranking.js';

async function seed() {
  await connectDB();

  // SAFETY: seeding wipes the database. Never do that to a database that
  // already holds real accounts (e.g. once MONGO_URI points at Atlas).
  // Use `FORCE_SEED=1 npm run seed` to deliberately reset.
  const existing = await User.countDocuments();
  if (existing > 0 && process.env.FORCE_SEED !== '1') {
    console.log(
      `⏭️  Seed skipped — database already has ${existing} user(s). ` +
        'Run with FORCE_SEED=1 to wipe and reseed.'
    );
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log('🌱 Seeding Collably...');

  await Promise.all([
    User.deleteMany({}),
    CompanyProfile.deleteMany({}),
    CreatorProfile.deleteMany({}),
    Campaign.deleteMany({}),
    Application.deleteMany({}),
    Collaboration.deleteMany({}),
    Conversation.deleteMany({}),
    Message.deleteMany({}),
    Review.deleteMany({}),
    MonthlyRanking.deleteMany({}),
  ]);

  // Admin
  await User.create({
    role: 'admin',
    name: 'Platform Admin',
    email: env.admin.email,
    password: env.admin.password,
    isVerified: true,
  });

  // Shared image helpers (verified-reachable Unsplash CDN placeholders)
  const U = 'https://images.unsplash.com';
  const img = (id, w = 400) => `${U}/${id}?w=${w}&q=70&auto=format&fit=crop`;
  const categoryImg = {
    Restaurant: img('photo-1517248135467-4c7edcad34c4', 800),
    Fashion: img('photo-1441984904996-e0b6ba687e04', 800),
    Gaming: img('photo-1542751371-adc38448a05e', 800),
  };

  // Companies
  const companySeeds = [
    { name: 'Spice Route Kitchen', industry: 'Restaurant', city: 'Bengaluru', country: 'India', phone: '9845100001', logo: img('photo-1552566626-52f8b828add9', 300), banner: categoryImg.Restaurant },
    { name: 'Aura Fashion Co.', industry: 'Fashion', city: 'Mumbai', country: 'India', phone: '9820100002', logo: img('photo-1490481651871-ab68de25d43d', 300), banner: categoryImg.Fashion },
    { name: 'PixelForge Games', industry: 'Gaming', city: 'Hyderabad', country: 'India', phone: '9848100003', logo: img('photo-1511512578047-dfb367046420', 300), banner: categoryImg.Gaming },
  ];
  const companies = [];
  for (const c of companySeeds) {
    const user = await User.create({
      role: 'company',
      name: c.name,
      email: `${c.name.toLowerCase().replace(/[^a-z]/g, '')}@demo.com`,
      // Razorpay's checkout asks for a contact number if we don't prefill one,
      // so demo accounts carry a phone to show the real experience.
      phone: c.phone,
      password: 'Password@123',
      isVerified: true,
      isAdminVerified: true,
      profileCompleted: true,
    });
    const profile = await CompanyProfile.create({
      user: user._id,
      companyName: c.name,
      industry: c.industry,
      city: c.city,
      country: c.country,
      logoUrl: c.logo,
      bannerUrl: c.banner,
      description: `${c.name} is a demo ${c.industry.toLowerCase()} brand on Collably.`,
    });
    companies.push({ user, profile });
  }

  // Creators
  const creatorSeeds = [
    { name: 'Ananya Rao', username: 'ananya.creates', followers: 24000, city: 'Bengaluru', phone: '9845012345', avatar: img('photo-1494790108377-be9c29b29330'), cats: ['Fashion', 'Beauty'] },
    { name: 'Rahul Menon', username: 'rahul.eats', followers: 68000, city: 'Kochi', phone: '9895023456', avatar: img('photo-1500648767791-00dcc994a43e'), cats: ['Restaurant', 'Travel'] },
    { name: 'Zara Sheikh', username: 'zarastyle', followers: 152000, city: 'Mumbai', phone: '9820034567', avatar: img('photo-1438761681033-6461ffad8d80'), cats: ['Fashion', 'Beauty'] },
  ];
  const creators = [];
  for (const c of creatorSeeds) {
    const user = await User.create({
      role: 'creator',
      name: c.name,
      email: `${c.username.replace(/[^a-z]/g, '')}@demo.com`,
      phone: c.phone,
      password: 'Password@123',
      isVerified: true,
      isAdminVerified: true,
      profileCompleted: true,
    });
    const profile = await CreatorProfile.create({
      user: user._id,
      fullName: c.name,
      username: c.username,
      avatarUrl: c.avatar,
      bio: `Content creator sharing lifestyle & reviews across ${c.cats.join(' & ')}.`,
      city: c.city,
      country: 'India',
      categories: c.cats,
      socials: [
        {
          platform: 'instagram',
          username: c.username,
          followers: c.followers,
          avgViews: Math.round(c.followers * 0.3),
          engagementRate: 4.2,
        },
      ],
    });
    creators.push({ user, profile });
  }

  // Campaigns
  const campaignSeeds = [
    {
      idx: 0,
      title: 'Instagram Reel for New Biryani Launch',
      category: 'Restaurant',
      campaignType: 'Sponsored Reel',
      followerRange: '10K-25K',
    },
    {
      idx: 1,
      title: 'Summer Collection Lookbook Collab',
      category: 'Fashion',
      campaignType: 'Product Review',
      followerRange: '50K-100K',
    },
    {
      idx: 2,
      title: 'Mobile Game Launch — YouTube Shorts',
      category: 'Gaming',
      campaignType: 'YouTube Video',
      followerRange: '25K-50K',
    },
  ];
  const campaigns = [];
  for (const s of campaignSeeds) {
    const { user, profile } = companies[s.idx];
    campaigns.push(await Campaign.create({
      company: user._id,
      companyProfile: profile._id,
      title: s.title,
      description: `We are looking for creators to help promote our launch. ${s.title}. Deliverables include one reel/video and story mentions.`,
      category: s.category,
      campaignType: s.campaignType,
      platforms: ['instagram'],
      followerRange: s.followerRange,
      city: profile.city,
      country: 'India',
      creatorsNeeded: 3,
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      bannerUrl: categoryImg[s.category] || '',
      isFeatured: true,
    }));
  }

  /**
   * Relationship data (v2 §29–§32, §13–§16).
   *
   * Without this the demo has campaigns but no applications, collaborations,
   * reviews or rank history — so the admin relationship views, the trophy card
   * and the rank discount all render empty and look broken.
   *
   * Deliberately spread across statuses and months: one pending application to
   * review, one active collaboration (which also unlocks a chat), and completed
   * ones both this month and last, so the monthly reset in §14 is visible.
   */
  const monthsAgo = (n) => {
    const d = new Date();
    d.setMonth(d.getMonth() - n);
    return d;
  };

  const rel = [
    // campaign idx, creator idx, application status, collaboration status, completedAt
    { c: 0, k: 0, app: 'accepted', collab: 'completed', done: monthsAgo(0) },
    { c: 0, k: 1, app: 'accepted', collab: 'active', done: null },
    { c: 0, k: 2, app: 'pending', collab: null, done: null },
    { c: 1, k: 2, app: 'accepted', collab: 'completed', done: monthsAgo(0) },
    { c: 1, k: 0, app: 'rejected', collab: null, done: null },
    { c: 2, k: 1, app: 'accepted', collab: 'completed', done: monthsAgo(1) },
  ];

  let collabCount = 0;
  for (const r of rel) {
    const campaign = campaigns[r.c];
    const creator = creators[r.k];
    const application = await Application.create({
      campaign: campaign._id,
      company: campaign.company,
      creator: creator.user._id,
      status: r.app,
      message: 'I love this brand and my audience is a strong match for this campaign.',
      respondedAt: r.app === 'pending' ? undefined : new Date(),
    });
    if (!r.collab) continue;

    const collaboration = await Collaboration.create({
      campaign: campaign._id,
      application: application._id,
      company: campaign.company,
      creator: creator.user._id,
      status: r.collab,
      completedAt: r.done || undefined,
    });
    collabCount++;

    // Chat only exists where a collaboration does — that IS the unlock rule (§20).
    const convo = await Conversation.create({
      campaign: campaign._id,
      application: application._id,
      collaboration: collaboration._id,
      participants: [campaign.company, creator.user._id],
      lastMessage: 'Sounds great — sending the brief over now.',
      lastMessageAt: new Date(),
    });
    await Message.create([
      {
        conversation: convo._id,
        sender: campaign.company,
        body: `Hi ${creator.user.name.split(' ')[0]}, thanks for applying. Are you free to shoot this week?`,
        readBy: [campaign.company, creator.user._id],
      },
      {
        conversation: convo._id,
        sender: creator.user._id,
        body: 'Yes, absolutely. I can deliver by Friday.',
        readBy: [campaign.company, creator.user._id],
      },
      {
        conversation: convo._id,
        sender: campaign.company,
        body: 'Sounds great — sending the brief over now.',
        readBy: [campaign.company],
      },
    ]);

    // Reviews only make sense once the work is finished
    if (r.collab === 'completed') {
      await Review.create([
        {
          collaboration: collaboration._id,
          campaign: campaign._id,
          author: campaign.company,
          subject: creator.user._id,
          authorRole: 'company',
          rating: 5,
          comment: 'Delivered on time and the content performed above our expectations.',
        },
        {
          collaboration: collaboration._id,
          campaign: campaign._id,
          author: creator.user._id,
          subject: campaign.company,
          authorRole: 'creator',
          rating: 5,
          comment: 'Clear brief and quick to respond. Would work with them again.',
        },
      ]);
    }
  }

  // Rank snapshots for the current month (§14) …
  for (const c of creators) await snapshotRanking(c.user._id, 'creator');
  for (const c of companies) await snapshotRanking(c.user._id, 'company');

  // … plus a prior month, so "previous month" and "highest ever" have something
  // to show and the monthly reset is demonstrable rather than theoretical.
  const prev = periodKey(monthsAgo(1));
  await MonthlyRanking.updateOne(
    { user: creators[0].user._id, period: prev },
    {
      $setOnInsert: {
        user: creators[0].user._id,
        role: 'creator',
        period: prev,
        completed: 9,
        rankKey: 'silver',
        rankName: 'Silver',
        discountPercent: 10,
      },
    },
    { upsert: true }
  );

  console.log(`   ${campaigns.length} campaigns · ${rel.length} applications · ${collabCount} collaborations`);
  console.log('✅ Seed complete.');
  console.log(`   Admin:   ${env.admin.email} / ${env.admin.password}`);
  console.log(`   Company: spiceroutekitchen@demo.com / Password@123`);
  console.log(`   Creator: ananyacreates@demo.com / Password@123`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
