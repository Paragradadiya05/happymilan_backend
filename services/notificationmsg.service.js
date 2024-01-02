import httpStatus from 'http-status';
import { Notification, User } from '../models';
import ApiError from '../utils/ApiError';

export async function createNotification(body = {}) {
  if (body.userId) {
    const userId = await User.findOne({ _id: body.userId });
    if (!userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field userId is not valid');
    }
  }
  const notification = await Notification.create(body);
  return notification;
}

export async function getNotification(filter, options = {}) {
  const notification = await Notification.find(filter, options.projection, options);
  return notification;
}
