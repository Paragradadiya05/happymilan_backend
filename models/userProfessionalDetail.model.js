import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from 'models/plugins';

const UserProfessionalDetailSchema = new mongoose.Schema(
  {
    jobTitel: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
    },
    jobType: {
      type: String,
    },
    coummpanyName: {
      type: String,
    },
    currentSalary: {
      type: Number,
    },
    workCity: {
      type: String,
    },
    workCountry: {
      type: String,
    },
    currentDesignation: {
      type: String,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
UserProfessionalDetailSchema.plugin(toJSON);
UserProfessionalDetailSchema.plugin(mongoosePaginateV2);
const UserProfessionalDetailModel =
  mongoose.models.UserProfessionalDetail ||
  mongoose.model('UserProfessionalDetail', UserProfessionalDetailSchema, 'UserProfessionalDetail');
module.exports = UserProfessionalDetailModel;
