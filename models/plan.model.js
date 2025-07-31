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
    price: {
      type: Number, // base price before discount
      required: true,
    },
    discount: {
      type: Number, // percentage (e.g. 10 for 10%)
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
    isPlanActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
planSchema.pre('save', function (next) {
  if (this.discount > 0) {
    this.discountAmount = (this.price * this.discount) / 100;
    this.totalPrice = this.price - this.discountAmount;
  } else {
    this.discountAmount = 0;
    this.totalPrice = this.price;
  }
  next();
});
planSchema.plugin(toJSON);
planSchema.plugin(mongoosePaginateV2);
const planModel = mongoose.models.plan || mongoose.model('Plan', planSchema, 'Plan');
module.exports = planModel;
