import mongoose from 'mongoose';

const { Schema } = mongoose;

const savedCampaignSchema = new Schema(
  {
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  },
  { timestamps: true }
);

savedCampaignSchema.index({ creator: 1, campaign: 1 }, { unique: true });

export const SavedCampaign = mongoose.model('SavedCampaign', savedCampaignSchema);
