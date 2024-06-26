import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from './plugins';

const paymentHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    stauts: {
      type: String, // update this after gating enum from razorrpay
    },
    razorpayLatestResponse: {
      type: Object,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    razorpayResponses: [Object],
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
paymentHistorySchema.plugin(toJSON);
paymentHistorySchema.plugin(mongoosePaginateV2);

const paymentHistoryModel =
  mongoose.models.paymentHistory || mongoose.model('paymentHistory', paymentHistorySchema, 'paymentHistory');
module.exports = paymentHistoryModel;
