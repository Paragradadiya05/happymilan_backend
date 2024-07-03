import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from 'models/plugins';
import enumModel from './enum.model';

const SpamUserSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
    },
    spamUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
    },
    reason: {
      type: String,
      enum: Object.values(enumModel.EnumOfReason),
    },
    remark: {
      type: String,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
SpamUserSchema.plugin(toJSON);
SpamUserSchema.plugin(mongoosePaginateV2);
const SpamUserModel = mongoose.models.SpamUser || mongoose.model('SpamUser', SpamUserSchema, 'SpamUser');
module.exports = SpamUserModel;
