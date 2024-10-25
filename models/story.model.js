import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from 'models/plugins';

const StorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
    },
    partnerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
    },
    images: [
      {
        type: mongoose.Mixed,
      },
    ],

    content: {
      type: String,
    },
    marriageDate: {
      type: String,
    },
    title: {
      type: String,
    },
    isConsentTaken: {
      type: Boolean,
      default: false,
    },
    consentTakenTime: {
      type: Date,
      default: Date.now,
    },
    createByAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
StorySchema.plugin(toJSON);
StorySchema.plugin(mongoosePaginateV2);
const StoryModel = mongoose.models.Story || mongoose.model('Story', StorySchema, 'Story');
module.exports = StoryModel;
