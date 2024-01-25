import httpStatus from 'http-status';
import { Like, Notification, User } from '../models';
import ApiError from '../utils/ApiError';

export async function createlike(body = {}, user) {
  const userId = user._id;
  if (!User.findOne(body.likeId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'no such user exists');
  }
  await Notification.create({ userId, otherUserId: body.likeId, body: 'like' });
  return Like.create({
    user: userId,
    likeId: body.likeId,
    createdBy: user,
    updatedBy: user,
  });
}
export async function getLike(filter, options = {}) {
  const like = await Like.find(filter, options.projection, options);
  return like;
}
export async function removeLike(filter) {
  const like = await Like.findOneAndRemove(filter);
  return like;
}
