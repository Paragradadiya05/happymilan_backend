import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { softDelete, toJSON } from './plugins';

const { Schema } = mongoose;

const creditSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Ensures one credit record per user
    },
    creditBalance: {
      type: Number,
      required: true,
      default: 0,
      min: 0, // Credits cannot be negative
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    // Add index for better query performance
    index: { userId: 1 },
  }
);

// Add plugins
creditSchema.plugin(toJSON);
creditSchema.plugin(mongoosePaginateV2);
creditSchema.plugin(softDelete, {
  isSoftDeleteAddon: true,
  overrideMethods: 'all',
  deleted: 'isDeleted',
  deletedBy: 'deletedBy',
  deletedAt: 'deletedAt',
});

// Pre-save middleware to ensure synchronization with user
creditSchema.pre('save', async function (next) {
  const User = mongoose.model('User');

  // Check if user exists
  const userExists = await User.findById(this.userId);
  if (!userExists) {
    throw new Error('User not found. Credit cannot be created without a valid user.');
  }

  next();
});

const Credit = mongoose.models.Credit || mongoose.model('Credit', creditSchema);
module.exports = Credit;
