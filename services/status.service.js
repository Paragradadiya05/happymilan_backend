import httpStatus from 'http-status';
import { Status, User } from '../models';
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
  const status = await Status.find(filter, options.projection, options);
  return status;
}
