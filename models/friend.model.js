import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from 'models/plugins';
import enumModel from 'models/enum.model';

const StatusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: Object.values(enumModel.EnumStatusOfFriend),
    required: true,
  },
  date: {
    type: Date,
  },
  initiatorUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});
const FriendSchema = new mongoose.Schema(
  {
    friend: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userBlock: {
      type: Boolean,
      default: false,
    },
    friendBlock: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: Object.values(enumModel.EnumStatusOfFriend),
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    lastInitiatorUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    statusHistory: {
      type: [StatusHistorySchema],
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
FriendSchema.plugin(toJSON);
FriendSchema.plugin(mongoosePaginateV2);
const FriendModel = mongoose.models.Friend || mongoose.model('Friend', FriendSchema, 'Friend');
module.exports = FriendModel;
