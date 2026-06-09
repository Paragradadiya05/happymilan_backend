import mongoose from 'mongoose';
import { toJSON } from 'models/plugins';

const emailMarketingSchema = new mongoose.Schema(
  {
    subject: { type: String },
    template: { type: String }, // signUpTemplate / offerTemplate / reminderTemplate

    contacts: [
      {
        name: { type: String },
        email: { type: String },
      },
    ],

    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Completed', 'Failed'],
      default: 'Pending',
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    totalContacts: {
      type: Number,
      default: 0,
    },
    failedEmails: [
      {
        email: String,
        error: String,
      },
    ],
    completedAt: Date,
  },
  { timestamps: true }
);

emailMarketingSchema.plugin(toJSON);

const EmailMarketing = mongoose.model('EmailMarketing', emailMarketingSchema);
export default EmailMarketing;
