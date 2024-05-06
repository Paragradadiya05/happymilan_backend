import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from './plugins';
import enumModel from './enum.model';

const userPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    planName: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(enumModel.EnumOfUserPlan),
      default: 'inactive',
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
userPlanSchema.plugin(toJSON);
userPlanSchema.plugin(mongoosePaginateV2);

const userPlanModel = mongoose.models.userPlan || mongoose.model('userPlan', userPlanSchema, 'userPlan');
module.exports = userPlanModel;
