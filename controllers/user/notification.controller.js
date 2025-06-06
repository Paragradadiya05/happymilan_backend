import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { notificationservice } from '../../services';

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
  const options = {};
  const { user } = req;
  const filter = {
    userId: user,
    title: { $in: ['Sent you a request', 'request-accepted', 'like'] },
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
  const notification = await notificationservice.updatenotification(filter, body, options, appUsesType);
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
