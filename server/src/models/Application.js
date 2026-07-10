import mongoose from 'mongoose';

const { Schema } = mongoose;

const applicationSchema = new Schema(
  {
    campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    company: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // 'application' = creator applied; 'invitation' = company invited
    origin: { type: String, enum: ['application', 'invitation'], default: 'application' },

    message: { type: String, default: '' },
    portfolioSnapshot: [{ type: String }], // urls chosen to showcase

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending',
      index: true,
    },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

// One active application per creator per campaign
applicationSchema.index({ campaign: 1, creator: 1 }, { unique: true });

export const Application = mongoose.model('Application', applicationSchema);
