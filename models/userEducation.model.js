import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from 'models/plugins';
import enumModel from './enum.model';

const UserEducationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
    },
    degree: {
      type: String,
      enum: Object.values(enumModel.EnumOfDegree),
    },
    collage: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    country: {
      type: String,
    },
    /**
     * created By
     * */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
    },
    /**
     * updated By
     * */
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
UserEducationSchema.plugin(toJSON);
UserEducationSchema.plugin(mongoosePaginateV2);
const UserEducationModel =
  mongoose.models.UserEducation || mongoose.model('UserEducation', UserEducationSchema, 'UserEducation');
module.exports = UserEducationModel;
