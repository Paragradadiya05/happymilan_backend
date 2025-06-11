import httpStatus from 'http-status';
import { Like, Notification, User } from '../models';
import ApiError from '../utils/ApiError';
import { sendNotification } from './notification.service';
import { EnumOfNotification } from '../models/enum.model';

export async function createLike(body = {}, user, appUsesType) {
  const userId = user._id;
  const getUser = await User.findOne({ _id: body.likedUserId, appUsesType });
  if (!getUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No such user exists');
  }
  const likedUser = await User.findById(body.likedUserId, appUsesType);
  if (!likedUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No such user exists');
  }
  const existingLike = await Like.findOne({ user: userId, likedUserId: body.likedUserId });

  if (existingLike) {
    if (existingLike.isLike) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Already liked this profile');
    }
    existingLike.isLike = true;
    existingLike.updatedBy = user;
    await existingLike.save();
    existingLike.statusHistory.push({
      isLike: true,
      date: new Date(),
    });
    await existingLike.save();

    // todo : notification add
    return existingLike;
  }
  const statusHistory = {
    isLike: true,
    date: new Date(),
  };
  const createNotificationForLikedProfile = await Notification.create({
    userId: body.likedUserId,
    otherUserId: user._id,
    userName: user.name,
    body: `${user.name} likes you`,
    title: EnumOfNotification.LIKE,
  });
  // await Notification.create({ userId, otherUserId: body.likedUserId, body: 'like' });
  console.log('=====createNotificationForLikedProfile====>', createNotificationForLikedProfile);

  console.log('===== like deviceTokens ====>', user);
  console.log('=== var like deviceTokens.length ===>', user.deviceTokens.length);
  if (likedUser && likedUser.deviceTokens && likedUser.deviceTokens.length) {
    await Promise.all(
      likedUser.deviceTokens.map(async (fcmToken) => {
        await sendNotification(
          fcmToken.deviceToken,
          {
            data: {
              _id: createNotificationForLikedProfile._id.toString(),
              userId: createNotificationForLikedProfile.userId.toString(),
              otherUserId: createNotificationForLikedProfile.otherUserId.toString(),
              body: `${user.name} likes you`,
              title: EnumOfNotification.LIKE,
              createdAt: createNotificationForLikedProfile.createdAt.toString(),
              updatedAt: createNotificationForLikedProfile.updatedAt.toString(),
            },
          },
          {}
        );
      })
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
export async function updateLike(filter, body, options = {}, appUsesType) {
  const like = await Like.findOneAndUpdate(filter, body, options, appUsesType);
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
    if (body.isLike === false) {
      await Notification.deleteOne({
        userId: like.likedUserId, // the user who received the like
        otherUserId: like.user, // the user who gave the like
        title: EnumOfNotification.LIKE, // match notification type
      });
    }
  }
  return like;
}
export async function getLikeListWithPagination(filter, options = {}) {
  const like = await Like.paginate(filter, options);
  return like;
}
