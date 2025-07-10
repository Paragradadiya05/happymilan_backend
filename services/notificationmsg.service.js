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
  const defaultLimit = options.limit || 100;

  // Step 1: Fetch notifications using paginate
  const rawData = await Notification.paginate(filter, {
    ...options,
    limit: defaultLimit,
    sort: { createdAt: -1 },
    populate: {
      path: 'otherUserId',
      select: 'name profilePic',
    },
  });

  const docs = rawData.results || []; // ✅ your data is in `results`, not `docs`

  // Step 2: Deduplicate by (otherUserId + title)
  const uniqueMap = new Map();
  const uniqueResults = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const notif of docs) {
    const otherUserId = notif.otherUserId._id || notif.otherUserId;
    const key = `${otherUserId}-${notif.title}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, true);
      uniqueResults.push(notif);
    }
  }

  // Step 3: Paginate the deduplicated results
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 10;
  const start = (page - 1) * limit;
  const end = start + limit;

  const pagedResults = uniqueResults.slice(start, end);

  return {
    results: pagedResults,
    totalResults: uniqueResults.length,
    page,
    totalPages: Math.ceil(uniqueResults.length / limit),
    hasNextPage: end < uniqueResults.length,
    hasPrevPage: page > 1,
  };
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

export async function deleteNotificationsByUser(userId) {
  await Notification.deleteMany({ userId });
}
