import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { Emailnotificationservice } from '../../services';

export const createNotification = catchAsync(async (req, res) => {
  const options = {};
  const notification = await Emailnotificationservice.createNotification(req.body, options);
  return res.status(httpStatus.OK).send({ results: notification });
});

export const getNotification = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const notification = await Emailnotificationservice.getNotification(filter, options);
  return res.status(httpStatus.OK).send({ results: notification });
});
