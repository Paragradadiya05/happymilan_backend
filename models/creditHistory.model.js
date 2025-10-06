import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { softDelete, toJSON } from './plugins';

const { Schema } = mongoose;

const creditHistorySchema = new Schema(
  {
    creditId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Credit',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    transactionType: {
      type: String,
      required: true,
      enum: ['credit', 'debit'],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: true,
      enum: [
        'Plan Purchase',
        'Mobile Number Request',
        'Plan Expired',
        'Manual Credit',
        'Manual Debit',
        'Refund',
        'Bonus Credit',
        'Profile View',
        'Message Send',
        'Contact Request',
        'Admin Adjustment',
        'Friend Request Accepted',
      ],
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: false,
    },
    balanceAfterTransaction: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    // Add indexes for better query performance
    index: [{ creditId: 1 }, { userId: 1 }, { createdAt: -1 }, { transactionType: 1 }],
  }
);

// Add plugins
creditHistorySchema.plugin(toJSON);
creditHistorySchema.plugin(mongoosePaginateV2);
creditHistorySchema.plugin(softDelete, {
  isSoftDeleteAddon: true,
  overrideMethods: 'all',
  deleted: 'isDeleted',
  deletedBy: 'deletedBy',
  deletedAt: 'deletedAt',
});

// Pre-save middleware to validate credit and user existence
creditHistorySchema.pre('save', async function (next) {
  const Credit = mongoose.model('Credit');
  const User = mongoose.model('User');

  // Check if credit record exists
  const creditExists = await Credit.findById(this.creditId);
  if (!creditExists) {
    throw new Error('Credit record not found. Cannot create credit history.');
  }

  // Check if user exists
  const userExists = await User.findById(this.userId);
  if (!userExists) {
    throw new Error('User not found. Cannot create credit history.');
  }

  // Ensure userId matches the creditId's userId
  if (creditExists.userId.toString() !== this.userId.toString()) {
    throw new Error('User ID does not match the credit record user.');
  }

  next();
});

const CreditHistory = mongoose.models.CreditHistory || mongoose.model('CreditHistory', creditHistorySchema);
module.exports = CreditHistory;
