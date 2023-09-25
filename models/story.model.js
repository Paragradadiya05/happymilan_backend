import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from 'models/plugins';

const StorySchema = new mongoose.Schema(
  {
    images: {
      type: mongoose.Mixed,
    },
    content: {
      type: String,
    },
    title: {
      type: String,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
StorySchema.plugin(toJSON);
StorySchema.plugin(mongoosePaginateV2);
const StoryModel = mongoose.models.Story || mongoose.model('Story', StorySchema, 'Story');
module.exports = StoryModel;
