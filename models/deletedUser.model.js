import mongoose from 'mongoose';

const deletedUserSchema = new mongoose.Schema(
  {
    originalUserId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    email: String,
    mobileNumber: String,
    countryCode: String,

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
  { timestamps: true }
);

const DeletedUser = mongoose.model('DeletedUser', deletedUserSchema);

export default DeletedUser;
