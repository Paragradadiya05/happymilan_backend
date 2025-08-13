import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { softDelete, toJSON } from './plugins';

const { Schema } = mongoose;

const mobileNumberRequestSchema = new Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    acceptedAt: {
      type: Date,
      required: false,
    },
    rejectedAt: {
      type: Date,
      required: false,
    },
    creditDeducted: {
      type: Number,
      required: false,
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
    index: [{ requesterId: 1 }, { targetUserId: 1 }, { status: 1 }, { createdAt: -1 }],
  }
);

// Add plugins
mobileNumberRequestSchema.plugin(toJSON);
mobileNumberRequestSchema.plugin(mongoosePaginateV2);
mobileNumberRequestSchema.plugin(softDelete, {
  isSoftDeleteAddon: true,
  overrideMethods: 'all',
  deleted: 'isDeleted',
  deletedBy: 'deletedBy',
  deletedAt: 'deletedAt',
});

// Compound index to prevent duplicate requests
mobileNumberRequestSchema.index(
  { requesterId: 1, targetUserId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' },
  }
);

// Pre-save middleware to validate request
mobileNumberRequestSchema.pre('save', async function (next) {
  const User = mongoose.model('User');

  // Check if requester exists
  const requesterExists = await User.findById(this.requesterId);
  if (!requesterExists) {
    throw new Error('Requester not found');
  }

  // Check if target user exists
  const targetUserExists = await User.findById(this.targetUserId);
  if (!targetUserExists) {
    throw new Error('Target user not found');
  }

  // Prevent self-requests
  if (this.requesterId.toString() === this.targetUserId.toString()) {
    throw new Error('Cannot request your own mobile number');
  }

  next();
});

// Set rejectedAt when status changes to rejected
mobileNumberRequestSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'rejected' && !this.rejectedAt) {
      this.rejectedAt = new Date();
    }
    if (this.status === 'accepted' && !this.acceptedAt) {
      this.acceptedAt = new Date();
    }
  }
  next();
});

const MobileNumberRequest =
  mongoose.models.MobileNumberRequest || mongoose.model('MobileNumberRequest', mobileNumberRequestSchema);
module.exports = MobileNumberRequest;
