import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { CompanyProfile } from '../models/CompanyProfile.js';
import { CreatorProfile } from '../models/CreatorProfile.js';
import { Campaign } from '../models/Campaign.js';

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

  console.log('🌱 Seeding InfluConnect...');

  await Promise.all([
    User.deleteMany({}),
    CompanyProfile.deleteMany({}),
    CreatorProfile.deleteMany({}),
    Campaign.deleteMany({}),
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
    { name: 'Spice Route Kitchen', industry: 'Restaurant', city: 'Bengaluru', country: 'India', logo: img('photo-1552566626-52f8b828add9', 300), banner: categoryImg.Restaurant },
    { name: 'Aura Fashion Co.', industry: 'Fashion', city: 'Mumbai', country: 'India', logo: img('photo-1490481651871-ab68de25d43d', 300), banner: categoryImg.Fashion },
    { name: 'PixelForge Games', industry: 'Gaming', city: 'Hyderabad', country: 'India', logo: img('photo-1511512578047-dfb367046420', 300), banner: categoryImg.Gaming },
  ];
  const companies = [];
  for (const c of companySeeds) {
    const user = await User.create({
      role: 'company',
      name: c.name,
      email: `${c.name.toLowerCase().replace(/[^a-z]/g, '')}@demo.com`,
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
      description: `${c.name} is a demo ${c.industry.toLowerCase()} brand on InfluConnect.`,
    });
    companies.push({ user, profile });
  }

  // Creators
  const creatorSeeds = [
    { name: 'Ananya Rao', username: 'ananya.creates', followers: 24000, city: 'Bengaluru', avatar: img('photo-1494790108377-be9c29b29330'), cats: ['Fashion', 'Beauty'] },
    { name: 'Rahul Menon', username: 'rahul.eats', followers: 68000, city: 'Kochi', avatar: img('photo-1500648767791-00dcc994a43e'), cats: ['Restaurant', 'Travel'] },
    { name: 'Zara Sheikh', username: 'zarastyle', followers: 152000, city: 'Mumbai', avatar: img('photo-1438761681033-6461ffad8d80'), cats: ['Fashion', 'Beauty'] },
  ];
  for (const c of creatorSeeds) {
    const user = await User.create({
      role: 'creator',
      name: c.name,
      email: `${c.username.replace(/[^a-z]/g, '')}@demo.com`,
      password: 'Password@123',
      isVerified: true,
      isAdminVerified: true,
      profileCompleted: true,
    });
    await CreatorProfile.create({
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
  for (const s of campaignSeeds) {
    const { user, profile } = companies[s.idx];
    await Campaign.create({
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
    });
  }

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
