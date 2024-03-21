import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from 'models/plugins';

const EmailNotificationSchema = new mongoose.Schema(
  {
    MyAletrsManager: {
      type: String,
    },
    matchMailAndPhotoMatchMail: {
      option: String,
      isSelected: Boolean,
    },
    emailAlert: [
      {
        option: String,
        isSelected: Boolean,
      },
    ],
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
EmailNotificationSchema.plugin(toJSON);
EmailNotificationSchema.plugin(mongoosePaginateV2);
const EmailNotificationModel =
  mongoose.models.Notification || mongoose.model('EmailNotification', EmailNotificationSchema, 'EmailNotification');
module.exports = EmailNotificationModel;
