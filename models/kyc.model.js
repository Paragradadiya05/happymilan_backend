const mongoose = require('mongoose');
const mongoosePaginateV2 = require('mongoose-paginate-v2');
const { toJSON, softDelete } = require('./plugins');
const enumModel = require('./enum.model');

const { ObjectId } = mongoose.Schema.Types;

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
