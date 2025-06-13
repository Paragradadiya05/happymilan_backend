import httpStatus from 'http-status';
import { Notification, User } from '../models';
import ApiError from '../utils/ApiError';

export async function createNotification(appUsesType, body = {}) {
  if (body.userId) {
    const userId = await User.findOne({ _id: body.userId, appUsesType });
    if (!userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field userId is not valid');
    }
  }
  const notification = await Notification.create(body);
  return notification;
}

export async function getNotification(filter, options = {}) {
  const notification = await Notification.find(filter, options.projection, options).sort({ createdAt: -1 }).populate({
    path: 'otherUserId',
    select: 'name profilePic',
  });
  return notification;
}
export async function getOne(query, options = {}) {
  const notification = await Notification.findOne(query, options.projection, options);
  return notification;
}
export async function updatenotification(filter, body, appUsesType, options = {}) {
  const notification = await Notification.findOneAndUpdate(filter, body, options);
  return notification;
}
export async function removeNotification(filter) {
  const notification = await Notification.findOneAndRemove(filter);
  return notification;
}
