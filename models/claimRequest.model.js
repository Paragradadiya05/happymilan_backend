const mongoose = require('mongoose');
const mongoosePaginateV2 = require('mongoose-paginate-v2');
const { toJSON } = require('./plugins');

const { ObjectId } = mongoose.Schema.Types;

const claimRequestSchema = new mongoose.Schema(
  {
    vendorId: {
      type: ObjectId,
      ref: 'User',
      required: true,
    },
    userId: {
      type: ObjectId,
      ref: 'User',
    },
    businessName: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    documentProof: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

claimRequestSchema.plugin(toJSON);
claimRequestSchema.plugin(mongoosePaginateV2);

module.exports = mongoose.model('ClaimRequest', claimRequestSchema);
