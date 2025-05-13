import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { softDelete, toJSON } from 'models/plugins';
// for status viewer
const StoryViewSchema = new mongoose.Schema(
  {
    statusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Status',
    },
    viewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
StoryViewSchema.plugin(toJSON);
StoryViewSchema.plugin(mongoosePaginateV2);
StoryViewSchema.plugin(softDelete, {
  isSoftDeleteAddon: true,
  overrideMethods: 'all',
  deleted: 'isDeleted',
  deletedBy: 'deletedBy',
  deletedAt: 'deletedAt',
});
const StoryViewModel = mongoose.models.StoryView || mongoose.model('StoryView', StoryViewSchema, 'StoryView');
module.exports = StoryViewModel;
