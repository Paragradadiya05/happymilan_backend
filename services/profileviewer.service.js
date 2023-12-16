import httpStatus from 'http-status';
import { profilrviwe, User } from '../models';
import ApiError from '../utils/ApiError';

export async function createprofileviewer(body = {}, user) {
  const userId = user._id;
  if (!User.findOne(body.viewerId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'no such user exists');
  }

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
