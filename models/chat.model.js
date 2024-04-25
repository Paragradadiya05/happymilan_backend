const mongoose = require('mongoose');
const mongoosePaginateV2 = require('mongoose-paginate-v2');
const { toJSON, softDelete } = require('./plugins');
const enumModel = require('./enum.model');
const { EnumOfChatType } = require('./enum.model');

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
    type: {
      type: String,
      enum: Object.values(enumModel.EnumOfChatType),
      default: EnumOfChatType.TEXT,
    },
    fileUrl: {
      type: String,
    },
    isReadMessage: {
      type: Boolean,
      default: false,
    },
    sendAt: {
      type: Number,
      default: Date.now,
    },
    messageDeletedFrom: {
      type: Boolean,
      default: false,
    },
    messageDeletedTo: {
      type: Boolean,
      default: false,
    },
    // this is for only group chat we don't need now so ignore it
    deleteMessageFromUser: {
      type: Array,
      ref: 'User',
    },
    messageDeletedAll: {
      type: Boolean,
      default: false,
    },
    // emoji , pic
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
