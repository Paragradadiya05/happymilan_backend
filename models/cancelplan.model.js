import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from './plugins';
import enumModel from './enum.model';

const cancelPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'userPlan',
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    cancellationReason: {
      type: String,
      enum: Object.values(enumModel.EnumOfCancelReason),
    },
    refundStatus: {
      type: String,
      enum: Object.values(enumModel.EnumOfRefundStatus),
      default: 'not_applicable',
    },
    otherReason: {
      type: String, // for detailed explanation if cancellationReason = "other"
      default: null,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    cancelledAt: {
      type: Date,
      default: Date.now,
    },
    effectiveCancellationDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

cancelPlanSchema.plugin(toJSON);
cancelPlanSchema.plugin(mongoosePaginateV2);

const cancelPlanModel = mongoose.models.cancelPlan || mongoose.model('cancelPlan', cancelPlanSchema, 'cancelPlan');
module.exports = cancelPlanModel;
