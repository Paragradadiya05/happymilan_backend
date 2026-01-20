import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from './plugins';

const deletedUserSchema = new mongoose.Schema(
  {
    originalUserId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    email: {
      type: String,
    },

    mobileNumber: {
      type: String,
    },

    countryCode: {
      type: String,
    },

    deleteReason: {
      type: String,
      required: true,
    },

    deletedBy: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },

    deletedAt: {
      type: Date,
      default: Date.now,
    },

    userSnapshot: {
      type: Object,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

// same plugins like other models
deletedUserSchema.plugin(toJSON);
deletedUserSchema.plugin(mongoosePaginateV2);

// IMPORTANT — same pattern
const DeletedUser = mongoose.models.DeletedUser || mongoose.model('DeletedUser', deletedUserSchema, 'DeletedUser');

module.exports = DeletedUser;
