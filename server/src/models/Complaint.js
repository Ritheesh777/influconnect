import mongoose from 'mongoose';

const { Schema } = mongoose;

const complaintSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: ['user', 'campaign', 'message'], required: true },
    targetUser: { type: Schema.Types.ObjectId, ref: 'User' },
    targetCampaign: { type: Schema.Types.ObjectId, ref: 'Campaign' },

    reason: { type: String, required: true },
    description: { type: String, default: '' },
    evidence: [{ type: String }], // screenshot / media urls

    status: {
      type: String,
      enum: ['open', 'reviewing', 'resolved', 'dismissed'],
      default: 'open',
      index: true,
    },
    resolutionNote: { type: String, default: '' },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

export const Complaint = mongoose.model('Complaint', complaintSchema);
