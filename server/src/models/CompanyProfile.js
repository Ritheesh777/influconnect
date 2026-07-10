import mongoose from 'mongoose';

const { Schema } = mongoose;

export const INDUSTRIES = [
  'Restaurant',
  'Cafe',
  'Fashion',
  'Beauty',
  'Fitness',
  'Travel',
  'Tech',
  'Gaming',
  'Education',
  'Health',
  'Other',
];

const companyProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    companyName: { type: String, required: true, trim: true },
    industry: { type: String, enum: INDUSTRIES, default: 'Other' },
    description: { type: String, maxlength: 2000, default: '' },
    website: { type: String, trim: true, default: '' },
    logoUrl: { type: String, default: '' },
    bannerUrl: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '', index: true },
    state: { type: String, default: '' },
    country: { type: String, default: '', index: true },

    // Denormalized reputation
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    campaignsPosted: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const CompanyProfile = mongoose.model('CompanyProfile', companyProfileSchema);
