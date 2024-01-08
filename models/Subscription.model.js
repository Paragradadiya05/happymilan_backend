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
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

SubscriptionSchema.plugin(toJSON);
SubscriptionSchema.plugin(mongoosePaginateV2);

const SubscriptionModel = mongoose.model('Subscription', SubscriptionSchema);

module.exports = SubscriptionModel;
