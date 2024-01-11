import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from './plugins';
import enumModel from './enum.model';

const SubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    selectedPlan: {
      type: String,
      enum: Object.values(enumModel.EnumOfPlan),
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    planPrice: {
      type: Number,
    },
    status: {
      type: String,
      enum: Object.values(enumModel.EnumOfStatus),
      default: 'active',
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

SubscriptionSchema.plugin(toJSON);
SubscriptionSchema.plugin(mongoosePaginateV2);
function getPlanDetails(selectedPlan) {
  const plans = enumModel.EnumOfPlan;
  switch (selectedPlan) {
    case plans.FREE:
      return { duration: 1, price: 0 };
    case plans.PAID:
      return { duration: 3, price: 3999 };
    case plans.SILVER:
      return { duration: 6, price: 4999 };
    case plans.PREMIUM:
      return { duration: 12, price: 7999 };
    default:
      return null;
  }
}
function calculateEndDate(startDate, duration) {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + duration);
  return endDate;
}
SubscriptionSchema.pre('save', function (next) {
  if (this.selectedPlan && !this.endDate) {
    const planDetails = getPlanDetails(this.selectedPlan);
    if (planDetails) {
      this.endDate = calculateEndDate(this.startDate, planDetails.duration);
      this.planPrice = planDetails.price;
    }
  }
  next();
});

const SubscriptionModel = mongoose.model('Subscription', SubscriptionSchema, 'Subscription');

module.exports = SubscriptionModel;
