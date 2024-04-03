import express from 'express';
import auth from 'middlewares/auth';
import validate from 'middlewares/validate';
import { emojiValidation } from 'validations/user';
import { emojiController } from 'controllers/user';

const router = express.Router();
/**
 * upload Emoji
 * */
router.post('/upload-emoji', auth(), validate(emojiValidation.uploadEmoji), emojiController.UploadEmoji);
/**
 * create Emoji
 * */
router.get('/get-emoji', auth(), validate(emojiValidation.getEmoji), emojiController.getEmoji);
export default router;
