import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { softDelete, toJSON } from './plugins';

const { Schema } = mongoose;
const ProfileViewerSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    viewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

ProfileViewerSchema.plugin(toJSON);
ProfileViewerSchema.plugin(mongoosePaginateV2);
ProfileViewerSchema.plugin(softDelete, {
  isSoftDeleteAddon: true,
  overrideMethods: 'all',
  deleted: 'isDeleted',
  deletedBy: 'deletedBy',
  deletedAt: 'deletedAt',
});

const Profileviwe = mongoose.models.profileviwe || mongoose.model('Profileviwe', ProfileViewerSchema);
module.exports = Profileviwe;
