import httpStatus from 'http-status';
import { profilrviwe, User, Notification } from '../models';
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
  return profilrviwe.create({
    user: userId,
    viewerId: body.viewerId,
    createdBy: user,
    updatedBy: user,
  });
}
export async function getprofileviewer(filter, options = {}) {
  const user = await profilrviwe.findOne(filter, options.projection, options);
  return user;
}
