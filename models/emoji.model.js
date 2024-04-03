import mongoose from 'mongoose';
import { toJSON } from 'models/plugins';

const EmojiSchema = new mongoose.Schema(
  {
    emojiUrl: {
      type: String,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
EmojiSchema.plugin(toJSON);
const EmojiModel = mongoose.models.Emoji || mongoose.model('Emoji', EmojiSchema, 'Emoji');
module.exports = EmojiModel;
