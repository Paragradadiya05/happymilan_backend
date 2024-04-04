import httpStatus from 'http-status';
import { Like, Notification, User } from '../models';
import ApiError from '../utils/ApiError';
import { sendNotification } from './notification.service';
import { EnumOfNotification } from '../models/enum.model';

export async function createLike(body = {}, user) {
  const userId = user._id;
  const likedUser = await User.findById(body.likedUserId);
  if (!likedUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No such user exists');
  }
  const existingLike = await Like.findOne({ user: userId, likedUserId: body.likedUserId, isLike: true });
  if (existingLike) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Already liked this profile');
  }
  const isLike = body.isLike !== undefined ? body.isLike : true;
  const statusHistory = {
    isLike,
    date: new Date(),
  };
  // await Notification.create({ userId, otherUserId: body.likedUserId, body: 'like' });

  const createNotificationForLikedProfile = await Notification.create({
    userId,
    otherUserId: body.likedUserId,
    body: EnumOfNotification.SOMEONE_LIKED_YOUR_PROFILE,
  });
  console.log('=====xx====>', createNotificationForLikedProfile);
  // send notification
  // check if usr hase deice token or not
  console.log('===== like deviceTokens ====>', user);
  console.log('=== var like deviceTokens.length ===>', user.deviceTokens.length);
  if (user && user.deviceTokens && user.deviceTokens.length) {
    const deviceToken = user.deviceTokens.map((fcmToken) => fcmToken.deviceToken);
    console.log('=== var like deviceToken name ===>', deviceToken);
    await sendNotification(
      deviceToken,
      {
        data: {
          _id: createNotificationForLikedProfile._id.toString(),
          userId: createNotificationForLikedProfile.userId.toString(),
          otherUserId: createNotificationForLikedProfile.otherUserId.toString(),
          body: EnumOfNotification.SOMEONE_LIKED_YOUR_PROFILE,
          createdAt: createNotificationForLikedProfile.createdAt.toString(),
          updatedAt: createNotificationForLikedProfile.updatedAt.toString(),
        },
      },
      {}
    );
  }

  return Like.create({
    user: userId,
    likedUserId: body.likedUserId,
    isLike: body.isLike,
    statusHistory: [statusHistory],
    createdBy: user,
    updatedBy: user,
  });
}
export async function getLike(filter, options = {}) {
  const like = await Like.find(filter, options.projection, options)
    .populate({ path: 'user', select: 'name' })
    .populate({ path: 'likedUserId', select: 'name' })
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
export async function getLikeListWithPagination(filter, options = {}) {
  const like = await Like.paginate(filter, options);
  return like;
}
