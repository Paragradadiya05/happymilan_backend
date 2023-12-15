import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { softDelete, toJSON } from './plugins';

const { Schema } = mongoose;
const ShortlistSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    shortlistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

ShortlistSchema.plugin(toJSON);
ShortlistSchema.plugin(mongoosePaginateV2);
ShortlistSchema.plugin(softDelete, {
  isSoftDeleteAddon: true,
  overrideMethods: 'all',
  deleted: 'isDeleted',
  deletedBy: 'deletedBy',
  deletedAt: 'deletedAt',
});

const Shortlist = mongoose.models.Shortlist || mongoose.model('Shortlist', ShortlistSchema);
module.exports = Shortlist;
