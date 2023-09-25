import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from 'models/plugins';

const BlogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    content: {
      type: String,
    },
    images: {
      type: [mongoose.Mixed],
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
BlogSchema.plugin(toJSON);
BlogSchema.plugin(mongoosePaginateV2);
const BlogModel = mongoose.models.Blog || mongoose.model('Blog', BlogSchema, 'Blog');
module.exports = BlogModel;
