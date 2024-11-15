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
const StoryLikeSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // this id is a user id of user that is liked by some other user
    storyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story',
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

StoryLikeSchema.plugin(toJSON);
StoryLikeSchema.plugin(mongoosePaginateV2);
StoryLikeSchema.plugin(softDelete, {
  isSoftDeleteAddon: true,
  overrideMethods: 'all',
  deleted: 'isDeleted',
  deletedBy: 'deletedBy',
  deletedAt: 'deletedAt',
});

const Storylike = mongoose.models.Storylike || mongoose.model('Storylike', StoryLikeSchema);
module.exports = Storylike;
