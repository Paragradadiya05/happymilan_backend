import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { softDelete, toJSON } from './plugins';

const { Schema } = mongoose;
const StatusHistorySchema = new mongoose.Schema({
  isLike: {
    type: Boolean,
    required: true,
  },
  date: {
    type: Date,
  },
});
const likeSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // this id is a user id of user that is liked by some other user
    likedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isLike: {
      type: Boolean,
      default: false,
    },
    statusHistory: {
      type: [StatusHistorySchema],
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

likeSchema.plugin(toJSON);
likeSchema.plugin(mongoosePaginateV2);
likeSchema.plugin(softDelete, {
  isSoftDeleteAddon: true,
  overrideMethods: 'all',
  deleted: 'isDeleted',
  deletedBy: 'deletedBy',
  deletedAt: 'deletedAt',
});

const like = mongoose.models.like || mongoose.model('Like', likeSchema);
module.exports = like;
