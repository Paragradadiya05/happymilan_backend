import httpStatus from 'http-status';
import { Shortlist, User } from '../models';
import ApiError from '../utils/ApiError';

export async function createshortList(body = {}) {
  const { userId } = body;

  console.log('=== var body.user ===>', typeof userId);

  if (!User.findOne(body.shortlistId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'no such user exists');
  }
  if (userId.toString() === body.shortlistId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'not add self in shortliat');
  }
  // todo : add condition for redundant data
  return Shortlist.create({
    userId,
    shortlistId: body.shortlistId,
  });
}
export async function getShortlist(filter, options = {}) {
  const user = await Shortlist.find(filter, options.projection, options);
  return user;
}
