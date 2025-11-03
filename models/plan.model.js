import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import enumModel from './enum.model';
import { toJSON } from './plugins';

// ✅ Utility Function
// eslint-disable-next-line import/prefer-default-export
export const getDiscountedPrice = (price, discount) => {
  if (!price || !discount) return price;

  const discountedAmount = (price * discount) / 100;
  const exactPrice = price - discountedAmount;

  // ✅ Round to the nearest 9 (e.g., 199, 299, 999)
  const rounded = Math.round(exactPrice / 10) * 10 - 1;
  console.log('=====rounded====>', rounded);
  return rounded;
};

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
    isDating: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

// ✅ Pre-save hook
planSchema.pre('save', function (next) {
  if (this.discount > 0) {
    this.discountAmount = (this.price * this.discount) / 100;
    this.totalPrice = getDiscountedPrice(this.price, this.discount);
  } else {
    this.discountAmount = 0;
    this.totalPrice = this.price;
  }
  next();
});

// ✅ Pre-update hook
planSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
  let update = this.getUpdate();

  // Merge $set into update if present
  if (update.$set) {
    update = { ...update, ...update.$set };
  }

  const { price } = update;
  const { discount } = update;

  if (price !== undefined || discount !== undefined) {
    const discountAmount = discount > 0 ? (price * discount) / 100 : 0;
    const totalPrice = discount > 0 ? getDiscountedPrice(price, discount) : price;

    this.set({
      discountAmount,
      totalPrice,
    });
  }

  next();
});

planSchema.plugin(toJSON);
planSchema.plugin(mongoosePaginateV2);

const planModel = mongoose.models.Plan || mongoose.model('Plan', planSchema, 'Plan');

module.exports = planModel;
