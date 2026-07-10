import mongoose from 'mongoose';

const { Schema } = mongoose;

// Public "Contact us" form submissions
const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    handled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);
