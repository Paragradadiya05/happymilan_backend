import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { toJSON } from 'models/plugins';

const PrivacySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    question: {
      type: String,
    },
    options: [
      {
        option: String,
        isSelected: Boolean,
      },
    ],
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
PrivacySchema.plugin(toJSON);
PrivacySchema.plugin(mongoosePaginateV2);
const PrivacyModel = mongoose.models.Privacy || mongoose.model('Privacy', PrivacySchema, 'Privacy');
module.exports = PrivacyModel;
