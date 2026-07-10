import mongoose from 'mongoose';

const { Schema } = mongoose;

export const CAMPAIGN_CATEGORIES = [
  'Restaurant',
  'Fashion',
  'Beauty',
  'Travel',
  'Gaming',
  'Tech',
  'Fitness',
  'Education',
  'Other',
];

export const CAMPAIGN_TYPES = [
  'Product Review',
  'Sponsored Reel',
  'Story',
  'YouTube Video',
  'Giveaway',
  'Brand Ambassador',
];

export const FOLLOWER_RANGES = [
  '1K-5K',
  '5K-10K',
  '10K-25K',
  '25K-50K',
  '50K-100K',
  '100K+',
];

const campaignSchema = new Schema(
  {
    company: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    companyProfile: { type: Schema.Types.ObjectId, ref: 'CompanyProfile' },

    title: { type: String, required: true, trim: true, index: 'text' },
    description: { type: String, required: true },
    bannerUrl: { type: String, default: '' },
    images: [{ type: String }],

    category: { type: String, enum: CAMPAIGN_CATEGORIES, default: 'Other', index: true },
    campaignType: { type: String, enum: CAMPAIGN_TYPES, default: 'Product Review' },
    platforms: [{ type: String, enum: ['instagram', 'youtube', 'tiktok', 'facebook'] }],
    followerRange: { type: String, enum: FOLLOWER_RANGES, default: '1K-5K', index: true },
    minEngagementRate: { type: Number, default: 0 },

    city: { type: String, default: '', index: true },
    state: { type: String, default: '' },
    country: { type: String, default: '', index: true },
    isWorldwide: { type: Boolean, default: false },

    creatorsNeeded: { type: Number, default: 1, min: 1 },
    deadline: { type: Date },
    terms: { type: String, default: '' },

    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'closed', 'completed'],
      default: 'active',
      index: true,
    },
    // Admin moderation
    moderation: {
      type: String,
      enum: ['approved', 'pending', 'flagged', 'removed'],
      default: 'approved',
      index: true,
    },
    isFeatured: { type: Boolean, default: false, index: true },

    // Denormalized counters
    viewsCount: { type: Number, default: 0 },
    applicationsCount: { type: Number, default: 0 },
    acceptedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

campaignSchema.index({ title: 'text', description: 'text' });

export const Campaign = mongoose.model('Campaign', campaignSchema);
