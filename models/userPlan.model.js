import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from './plugins';
import enumModel from './enum.model';

const userPlanSchema = new mongoose.Schema(
  {
    // todo: handle all plan releted edge cases
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
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
    // todo : array contain [ status, enddate, startdate , planid ]
    // statusHistory : {
    //
    // }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
userPlanSchema.plugin(toJSON);
userPlanSchema.plugin(mongoosePaginateV2);

const userPlanModel = mongoose.models.userPlan || mongoose.model('userPlan', userPlanSchema, 'userPlan');
module.exports = userPlanModel;
