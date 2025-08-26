const mongoose = require('mongoose');
const mongoosePaginateV2 = require('mongoose-paginate-v2');
const { toJSON, softDelete } = require('./plugins');
const enumModel = require('./enum.model');

const { ObjectId } = mongoose.Schema.Types;
const NameRequestSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  kycDocName: {
    type: String,
    enum: Object.values(enumModel.EnumOfKyc),
  },
  kycDocImagePath: String,
  approvedBy: {
    type: ObjectId,
    ref: 'Admin',
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  approvedAt: Date,
  rejectReason: String,
});
const DocUploadHistorySchema = new mongoose.Schema({
  kycDocName: {
    type: String,
    enum: Object.values(enumModel.EnumOfKyc),
  },
  kycDocImagePath: String,
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  firstName: String,
  lastName: String,
});
const KycSchema = mongoose.Schema(
  {
    kycDocName: {
      type: String,
      enum: Object.values(enumModel.EnumOfKyc),
    },
    kycDocImagePath: {
      type: String,
      required: true,
    },
    verify: {
      type: Boolean,
      default: false,
    },
    verifyUserId: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: ObjectId,
      required: true,
      ref: 'User',
    },
    isDocRejected: {
      type: Boolean,
      default: false,
    },
    rejectReason: {
      type: String,
    },
    isDocUpload: {
      type: Boolean,
      default: false,
    },
    isSelfieUpload: {
      type: Boolean,
      default: false,
    },
    adminDocUpload: { type: Boolean, default: false },
    adminSelfieUpload: { type: Boolean, default: false },
    nameRequest: [NameRequestSchema],
    docUploadHistory: [DocUploadHistorySchema],
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

KycSchema.plugin(toJSON);
KycSchema.plugin(mongoosePaginateV2);
KycSchema.plugin(softDelete, {
  isSoftDeleteAddon: true,
  overrideMethods: 'all',
  deleted: 'isDeleted',
  deletedBy: 'deletedBy',
  deletedAt: 'deletedAt',
});

module.exports = mongoose.model('Kyc', KycSchema);
