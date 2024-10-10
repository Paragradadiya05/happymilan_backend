import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from 'models/plugins';
import enumModel from './enum.model';

const UserDatingPartnerSchema = new mongoose.Schema(
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
    preferredLocation: [String],
    interestedIn: {
      type: [String],
      enum: Object.values(enumModel.EnumOfInterest),
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
UserDatingPartnerSchema.plugin(toJSON);
UserDatingPartnerSchema.plugin(mongoosePaginateV2);
const UserDatingPartnerModel =
  mongoose.models.UserDatingPartner || mongoose.model('UserDatingPartner', UserDatingPartnerSchema, 'UserDatingPartner');
module.exports = UserDatingPartnerModel;
