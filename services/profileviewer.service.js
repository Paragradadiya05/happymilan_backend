import httpStatus from 'http-status';
import { ProfileView, User, Notification } from '../models';
import ApiError from '../utils/ApiError';

export async function createprofileviewer(body = {}, user) {
  const userId = user._id;
  const { viewerId } = body;
  if (!User.findOne(body.viewerId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'no such user exists');
  }
  const viewer = await User.findOne({ _id: viewerId });
  if (!viewer) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No such user exists');
  }
  await Notification.create({ userId, otherUserId: body.viewerId, body: 'view your profile' });
  return ProfileView.create({
    user: userId,
    viewerId: body.viewerId,
    createdBy: user,
    updatedBy: user,
  });
}
export async function getProfileViewer(filter, options = {}) {
  const user = await ProfileView.findOne(filter, options.projection, options).populate('user').populate('viewerId');
  return user;
}
