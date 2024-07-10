import httpStatus from 'http-status';
import { Friend, Status, User } from '../models';
import ApiError from '../utils/ApiError';

export async function createStatus(body = {}) {
  if (body.userId) {
    const userId = await User.findOne({ _id: body.userId });
    if (!userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field userId is not valid');
    }
  }
  const status = await Status.create(body);
  return status;
}
export async function getStatusList(filter, options = {}) {
  const status = await Status.find(filter, options.projection, options).populate({
    path: 'userId',
    select: ['name', 'profilePic'],
  });
  return status;
}

export async function updateStatus(filter, body, options = {}) {
  const status = await Status.findOneAndUpdate(filter, body, options);
  return status;
}

export async function removeStatus(filter) {
  const status = await Status.findOneAndRemove(filter);
  return status;
}

export async function getStatusListFrd(userId, options = {}) {
  // Get the list of friends for the user
  const friends = await Friend.find({
    $or: [
      { user: userId, status: 'accepted', userBlock: false, friendBlock: false },
      { friend: userId, status: 'accepted', userBlock: false, friendBlock: false },
    ],
  }).select('user friend');

  const friendIds = friends.map((friend) => {
    console.log('Friend entry:', friend); // Add logging for each entry
    if (friend.user.toString() === userId.toString()) {
      return friend.friend;
    }
    return friend.user;
  });
  friendIds.push(userId);
  const status = await Status.find({ userId: { $in: friendIds } }, options.projection, options).populate({
    path: 'userId',
    select: ['name', 'profilePic'],
  });

  return status;
}
