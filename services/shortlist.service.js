import httpStatus from 'http-status';
import { Shortlist, User } from '../models';
import ApiError from '../utils/ApiError';

export async function createshortList(body = {}) {
  const { userId, shortlistId } = body;

  console.log('=== var body.user ===>', typeof userId);

  if (!User.findOne(body.shortlistId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'no such user exists');
  }
  if (userId.toString() === body.shortlistId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'not add self in shortliat');
  }
  const existingShortlist = await Shortlist.findOne({ userId, shortlistId });
  if (existingShortlist) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User is already in the shortlist');
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

export async function removeshotylist(filter = {}) {
  const user = await Shortlist.findOneAndRemove(filter);
  return user;
}

export async function getshortListWithPagination(filter, options = {}) {
  const user = await Shortlist.paginate(filter, options);
  return user;
}
