import httpStatus from 'http-status';
import { Like, Notification, User } from '../models';
import ApiError from '../utils/ApiError';

export async function createLike(body = {}, user) {
  const userId = user._id;
  if (!User.findOne(body.likeId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'no such user exists');
  }
  if (body.isLike === true) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'already Like this profile');
  }
  const isLike = body.isLike !== undefined ? body.isLike : true;
  const statusHistory = {
    isLike,
    date: new Date(),
  };
  await Notification.create({ userId, otherUserId: body.likeId, body: 'like' });
  return Like.create({
    user: userId,
    likeId: body.likeId,
    isLike: body.isLike,
    statusHistory: [statusHistory],
    createdBy: user,
    updatedBy: user,
  });
}
export async function getLike(filter, options = {}) {
  const like = await Like.find(filter, options.projection, options)
    .populate({ path: 'user', select: 'name' })
    .populate({ path: 'likeId', select: 'name' })
    .exec();
  return like;
}
export async function removeLike(filter) {
  const like = await Like.findOneAndRemove(filter);
  return like;
}
export async function updateLike(filter, body, options = {}) {
  const like = await Like.findOneAndUpdate(filter, body, options);
  if (!like) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Like not found');
  }

  // eslint-disable-next-line no-prototype-builtins
  if (body.hasOwnProperty('isLike')) {
    const statusHistory = {
      isLike: body.isLike,
      date: new Date(),
    };
    like.statusHistory.push(statusHistory);
    await like.save();
  }
  return like;
}
