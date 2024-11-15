import httpStatus from 'http-status';
import { Story, StoryLike } from '../models';
import ApiError from '../utils/ApiError';

export async function createLike(body = {}, user) {
  const userId = user._id;

  const likedUser = await Story.findById(body.storyId);
  if (!likedUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No such story exists');
  }
  const existingLike = await StoryLike.findOne({ storyId: body.storyId, user: userId });

  if (existingLike) {
    if (existingLike.isLike) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Already liked this Story');
    }
    existingLike.isLike = true;
    existingLike.updatedBy = user;
    await existingLike.save();
    existingLike.statusHistory.push({
      isLike: true,
      date: new Date(),
    });
    await existingLike.save();

    return existingLike;
  }
  const statusHistory = {
    isLike: true,
    date: new Date(),
  };
  return StoryLike.create({
    user: userId,
    storyId: body.storyId,
    isLike: body.isLike,
    statusHistory: [statusHistory],
    createdBy: user,
    updatedBy: user,
  });
}
export async function getLike(filter, options = {}) {
  const like = await StoryLike.find(filter, options.projection, options)
    .populate({ path: 'user', select: 'name' })
    .populate({ path: 'storyId' })
    .exec();
  return like;
}
export async function removeLike(filter) {
  const like = await StoryLike.findOneAndRemove(filter);
  return like;
}
export async function updateLike(filter, body, options = {}) {
  const like = await StoryLike.findOneAndUpdate(filter, body, options);
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
  const like = await StoryLike.paginate(filter, options);
  return like;
}
