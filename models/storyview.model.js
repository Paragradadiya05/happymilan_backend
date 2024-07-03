import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from 'models/plugins';

const StoryViewSchema = new mongoose.Schema(
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
StoryViewSchema.plugin(toJSON);
StoryViewSchema.plugin(mongoosePaginateV2);
const StoryViewModel = mongoose.models.StoryView || mongoose.model('StoryView', StoryViewSchema, 'StoryView');
module.exports = StoryViewModel;
