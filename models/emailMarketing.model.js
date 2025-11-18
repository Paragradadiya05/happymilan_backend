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
      enum: ['Pending', 'Completed'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

emailMarketingSchema.plugin(toJSON);

const EmailMarketing = mongoose.model('EmailMarketing', emailMarketingSchema);
export default EmailMarketing;
