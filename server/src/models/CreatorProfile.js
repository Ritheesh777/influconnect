import mongoose from 'mongoose';

const { Schema } = mongoose;

export const PLATFORMS = ['instagram', 'youtube', 'tiktok', 'facebook', 'twitter', 'linkedin'];

const socialAccountSchema = new Schema(
  {
    platform: { type: String, enum: PLATFORMS, required: true },
    username: { type: String, required: true, trim: true },
    profileUrl: { type: String, default: '' },
    followers: { type: Number, default: 0, min: 0 },
    avgViews: { type: Number, default: 0, min: 0 },
    engagementRate: { type: Number, default: 0, min: 0 }, // percentage
    verified: { type: Boolean, default: false }, // future: OAuth-verified metrics
  },
  { _id: true }
);

const portfolioItemSchema = new Schema(
  {
    type: { type: String, enum: ['image', 'video', 'pdf', 'certificate'], default: 'image' },
    title: { type: String, default: '' },
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
  },
  { _id: true, timestamps: true }
);

const creatorProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, index: true },
    bio: { type: String, maxlength: 1000, default: '' },
    avatarUrl: { type: String, default: '' },
    city: { type: String, default: '', index: true },
    state: { type: String, default: '' },
    country: { type: String, default: '', index: true },
    categories: [{ type: String }], // niches the creator works in

    socials: [socialAccountSchema],
    portfolio: [portfolioItemSchema],
    mediaKitUrl: { type: String, default: '' },

    // Denormalized helpers for search/matching
    totalFollowers: { type: Number, default: 0, index: true },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Keep totalFollowers in sync with the sum of social followers
creatorProfileSchema.pre('save', function syncFollowers(next) {
  if (this.isModified('socials')) {
    this.totalFollowers = (this.socials || []).reduce((sum, s) => sum + (s.followers || 0), 0);
  }
  next();
});

export const CreatorProfile = mongoose.model('CreatorProfile', creatorProfileSchema);
