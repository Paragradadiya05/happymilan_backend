import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { notificationservice } from '../../services';

export const createNotification = catchAsync(async (req, res) => {
  const options = {};
  const notification = await notificationservice.createNotification(req.body, options);
  return res.status(httpStatus.OK).send({ results: notification });
});

export const getNotification = catchAsync(async (req, res) => {
  const options = {};
  const filter = {};
  const notification = await notificationservice.getNotification(filter, options);
  return res.status(httpStatus.OK).send({ results: notification });
});
