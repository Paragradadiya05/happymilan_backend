import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { softDelete, toJSON } from './plugins';

const { Schema } = mongoose;
const ProfileViewerSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

const ProfileView = mongoose.models.profileviwe || mongoose.model('ProfileView', ProfileViewerSchema);
module.exports = ProfileView;
