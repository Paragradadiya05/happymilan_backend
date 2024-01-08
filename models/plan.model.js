import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import enumModel from './enum.model';
import { toJSON } from './plugins';

const planSchema = new mongoose.Schema(
  {
    planName: {
      type: String,
      enum: Object.values(enumModel.EnumOfPlan),
    },
    planDuration: {
      type: String,
      enum: Object.values(enumModel.EnumOfPlanDuration),
    },
    allowNumberOfProfile: {
      type: Number,
    },
    allowNumberOfRequest: {
      type: Number,
    },
    onlineSupport: {
      type: String,
      enum: Object.values(enumModel.EnumOfOnlineSupport),
    },
    discount: {
      type: Number,
    },
    price: {
      type: Number,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
planSchema.plugin(toJSON);
planSchema.plugin(mongoosePaginateV2);
const planModel = mongoose.models.plan || mongoose.model('Plan', planSchema, 'Plan');
module.exports = planModel;
