import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { notificationservice } from '../../services';
import { Notification } from '../../models';

export const createNotification = catchAsync(async (req, res) => {
  const options = {};
  const { appUsesType } = req.query;
  const notification = await notificationservice.createNotification(req.body, options, appUsesType);
  return res.status(httpStatus.OK).send({ results: notification });
});

export const getNotification = catchAsync(async (req, res) => {
  const options = {};
  const filter = {};
  const notification = await notificationservice.getNotification(filter, options);
  return res.status(httpStatus.OK).send({ results: notification });
});

export const getNotificationById = catchAsync(async (req, res) => {
  const { user } = req;
  const { page, limit } = req.query;
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const filter = {
    userId: user,
    title: {
      $in: [
        'Sent you a request',
        'accepted your request',
        'like',
        'Declined your request',
        'new story',
        'Mobile Number Request',
        'Request Accepted',
        'Request Rejected',
      ],
    },
  };
  const options = {
    page: pageNumber,
    limit: limitNumber,
  };
  const notification = await notificationservice.getNotification(filter, options);
  return res.status(httpStatus.OK).send({ results: notification });
});

export const update = catchAsync(async (req, res) => {
  const { body } = req;
  const { notificationId } = req.params;
  const { appUsesType } = req.query;
  const filter = {
    _id: notificationId,
  };
  const options = { new: true };
  const notification = await notificationservice.updatenotification(filter, body, appUsesType, options);
  if (notification.read === true) {
    // eslint-disable-next-line no-undef
    await Notification.updateMany(
      {
        userId: req.user,
        read: false,
        createdAt: { $lte: notification.createdAt },
      },
      { $set: { read: true } }
    );
  }
  return res.status(httpStatus.OK).send({ results: notification });
});

export const remove = catchAsync(async (req, res) => {
  const { notificationId } = req.params;
  const filter = {
    _id: notificationId,
  };
  const notification = await notificationservice.removeNotification(filter);
  return res.status(httpStatus.OK).send({ results: notification });
});

export const getById = catchAsync(async (req, res) => {
  const { notificationId } = req.params;
  const filter = {
    _id: notificationId,
  };
  const notification = await notificationservice.getOne(filter);
  return res.status(httpStatus.OK).send({ results: notification });
});

export const deleteAllNotifications = catchAsync(async (req, res) => {
  const { user } = req;
  await notificationservice.deleteNotificationsByUser(user);
  return res.status(httpStatus.OK).send({ message: 'All notifications deleted successfully' });
});
