import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from 'models/plugins';

const UserEducationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
    },
    degree: {
      type: String,
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
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
UserEducationSchema.plugin(toJSON);
UserEducationSchema.plugin(mongoosePaginateV2);
const UserEducationModel =
  mongoose.models.UserEducation || mongoose.model('UserEducation', UserEducationSchema, 'UserEducation');
module.exports = UserEducationModel;
