import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from 'models/plugins';

const UserProfessionalDetailSchema = new mongoose.Schema(
  {
    jobTitle: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
    },
    jobType: {
      type: String,
    },
    companyName: {
      type: String,
    },
    currentSalary: {
      type: String,
    },
    workCity: {
      type: String,
    },
    workCountry: {
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
UserProfessionalDetailSchema.plugin(toJSON);
UserProfessionalDetailSchema.plugin(mongoosePaginateV2);
const UserProfessionalDetailModel =
  mongoose.models.UserProfessionalDetail ||
  mongoose.model('UserProfessionalDetail', UserProfessionalDetailSchema, 'UserProfessionalDetail');
module.exports = UserProfessionalDetailModel;
