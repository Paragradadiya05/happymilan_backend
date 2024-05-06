import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from './plugins';

const PaymentSchema = new mongoose.Schema(
  {
    bankName: {
      type: String,
      required: true,
    },
    branchName: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    ifsc: {
      type: String,
      required: true,
    },
    AccountType: {
      type: String,
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
PaymentSchema.plugin(toJSON);
PaymentSchema.plugin(mongoosePaginateV2);

const PaymentModel = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema, 'Payment');
module.exports = PaymentModel;
