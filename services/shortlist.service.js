import httpStatus from 'http-status';
import { Shortlist, User } from '../models';
import ApiError from '../utils/ApiError';

export async function createshortList(body = {}) {
  const userId = body.user;

  if (!User.findOne(body.shortlistId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'no such user exists');
  }
  if (body.user._id.toString() === body.shortlistId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'not add self in shortliat');
  }
  return Shortlist.create({
    userId,
    shortlistId: body.shortlistId,
  });
}
export async function getShortlist(filter, options = {}) {
  const user = await Shortlist.find(filter, options.projection, options);
  return user;
}
