import mongoose from 'mongoose';

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, default: '' },
    attachments: [
      {
        type: { type: String, enum: ['image', 'pdf', 'file'], default: 'file' },
        url: String,
        name: String,
      },
    ],
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: 1 });

export const Message = mongoose.model('Message', messageSchema);
