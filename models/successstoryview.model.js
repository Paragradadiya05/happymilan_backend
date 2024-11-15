import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from 'models/plugins';
// for SuccessStory viewer
const SuccessStoryViewSchema = new mongoose.Schema(
  {
    storyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story',
    },
    viewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
SuccessStoryViewSchema.plugin(toJSON);
SuccessStoryViewSchema.plugin(mongoosePaginateV2);
const SuccessStoryViewModel =
  mongoose.models.SuccessStoryView || mongoose.model('SuccessStoryView', SuccessStoryViewSchema, 'SuccessStoryView');
module.exports = SuccessStoryViewModel;
