import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from 'models/plugins';

const messageConsentSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    primaryConsent: {
      type: Boolean,
      default: false,
    },
    secondaryConsent: {
      type: String,
    },
    report: {
      data: {
        type: mongoose.Schema.Types.Mixed,
      },
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
messageConsentSchema.plugin(toJSON);
messageConsentSchema.plugin(mongoosePaginateV2);
const messageconsentModel =
  mongoose.models.messageConsent || mongoose.model('messageConsent', messageConsentSchema, 'messageConsent');
module.exports = messageconsentModel;
