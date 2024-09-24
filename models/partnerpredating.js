import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from 'models/plugins';
import enumModel from './enum.model';

// todo : add unique in user partner in userid
const UserPartnerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      unique: true,
    },
    age: {
      min: Number,
      max: Number,
    },
    distanceRange: {
      min: Number,
      max: Number,
    },
    appUsesType: {
      type: [String],
      enum: Object.values(enumModel.EnumAppUsesTypeOfUsers),
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
UserPartnerSchema.plugin(toJSON);
UserPartnerSchema.plugin(mongoosePaginateV2);
const UserPartnerModel = mongoose.models.UserPartner || mongoose.model('UserPartner', UserPartnerSchema, 'UserPartner');
module.exports = UserPartnerModel;
