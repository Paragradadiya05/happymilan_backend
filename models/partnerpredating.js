import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from 'models/plugins';
import enumModel from './enum.model';

// todo : add unique in user partner in userid
const UserdatingPartnerSchema = new mongoose.Schema(
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
    interestedIn: {
      type: [String],
      enum: Object.values(enumModel.EnumAppUsesTypeOfUsers),
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
UserdatingPartnerSchema.plugin(toJSON);
UserdatingPartnerSchema.plugin(mongoosePaginateV2);
const UserDatingPartnerModel =
  mongoose.models.UserDatingPartner || mongoose.model('UserDatingPartner', UserdatingPartnerSchema, 'UserDatingPartner');
module.exports = UserDatingPartnerModel;
