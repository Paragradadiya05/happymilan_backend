const mongoose = require('mongoose');
const mongoosePaginateV2 = require('mongoose-paginate-v2');
const { toJSON, softDelete } = require('./plugins');

const { ObjectId } = mongoose.Schema.Types;

const MessageSchema = mongoose.Schema(
  {
    from: {
      type: ObjectId,
      required: true,
      ref: 'User',
    },
    to: {
      type: ObjectId,
      required: true,
      ref: 'User',
    },
    message: {
      type: String,
      required: true,
    },
    isReadMessage: {
      type: Boolean,
      default: false,
      select: false,
    },
    sendAt: {
      type: Number,
      default: Date.now,
    },
    messageDeleted: {
      type: Boolean,
      default: false,
    },
    deleteMessageFromUser: {
      type: Array,
      ref: 'User',
    },
    messageDeletedAll: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

MessageSchema.plugin(toJSON);
MessageSchema.plugin(mongoosePaginateV2);
MessageSchema.plugin(softDelete, {
  isSoftDeleteAddon: true,
  overrideMethods: 'all',
  deleted: 'isDeleted',
  deletedBy: 'deletedBy',
  deletedAt: 'deletedAt',
});
module.exports = mongoose.model('Message', MessageSchema);
