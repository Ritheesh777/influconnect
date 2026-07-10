import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * A Collaboration is created when an Application/Invitation is accepted.
 * It owns exactly one Conversation and is the unit that gets reviewed.
 */
const collaborationSchema = new Schema(
  {
    campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    application: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
    company: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
      index: true,
    },
    completedAt: { type: Date },

    // Which sides have left a review (drives "Leave a Review" button visibility)
    companyReviewed: { type: Boolean, default: false },
    creatorReviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Collaboration = mongoose.model('Collaboration', collaborationSchema);
