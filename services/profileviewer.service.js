import httpStatus from 'http-status';
import { profilrviwe, User } from '../models';
import ApiError from '../utils/ApiError';

export async function createprofileviewer(body = {}) {
  const userId = body.user;
  if (!User.findOne(body.viewerId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'no such user exists');
  }
  return profilrviwe.create({
    userId,
    viewerId: body.viewerId,
  });
}
export async function getprofileviewer(filter, options = {}) {
  const user = await profilrviwe.findOne(filter, options.projection, options);
  return user;
}
