import httpStatus from 'http-status';
import { Emoji } from '../models';
import { getSignedUrlPutObject } from './s3.service';
import ApiError from '../utils/ApiError';

export const uploadEmoji = async (preSignedReq) => {
  const allowedExtensions = ['png', 'jpg', 'jpeg', 'gif']; // Define allowed extensions for emojis

  Object.assign(preSignedReq, {
    key: `users/happy-milan/emoji/${preSignedReq.key}`,
  });
  // Extract extension from the key
  const extensionOfKey = preSignedReq.key.split('.').pop();

  // Validate if extension exists
  if (!extensionOfKey) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid key');
  }

  // Check if the extension is allowed
  if (!allowedExtensions.includes(extensionOfKey.toLowerCase())) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid file extension');
  }

  // Check if the content type is correct (you may adjust this based on your requirements)
  if (preSignedReq.contentType !== 'image/png' && preSignedReq.contentType !== 'image/jpeg') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid content-type');
  }

  // Generate signed URL for uploading to S3
  const url = await getSignedUrlPutObject(preSignedReq.key, preSignedReq.contentType, true);
  const emoji = new Emoji({
    emojiUrl: url.split('?')[0],
    // Add other relevant fields here if necessary
  });
  await emoji.save();
  // store url in db of emoji model

  // Return the URL and key of the uploaded emoji
  return { url, key: preSignedReq.key };
};
export async function getEmoji(filter, options = {}) {
  const emoji = await Emoji.find(filter, options.projection, options);
  return emoji;
}
