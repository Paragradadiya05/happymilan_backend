import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { emojiService } from '../../services';

export const UploadEmoji = catchAsync(async (req, res) => {
  const { body, user } = req;
  const s3PutObject = await emojiService.uploadEmoji(body, user);
  return res.status(httpStatus.OK).send({ results: s3PutObject });
});

export const getEmoji = catchAsync(async (req, res) => {
  const options = {};
  const emoji = await emojiService.getEmoji(req.body, options);
  return res.status(httpStatus.OK).send({ results: emoji });
});
