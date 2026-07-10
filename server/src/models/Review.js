import mongoose from 'mongoose';

const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    collaboration: { type: Schema.Types.ObjectId, ref: 'Collaboration', required: true, index: true },
    campaign: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // reviewed user
    authorRole: { type: String, enum: ['company', 'creator'], required: true },

    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000, default: '' },
  },
  { timestamps: true }
);

// One review per author per collaboration
reviewSchema.index({ collaboration: 1, author: 1 }, { unique: true });

export const Review = mongoose.model('Review', reviewSchema);
