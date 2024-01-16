import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { subscriptionservice } from '../../services';

export const create = catchAsync(async (req, res) => {
  const { body } = req;
  body.createdBy = req.admin;
  body.updatedBy = req.admin;
  const options = {};
  const Subscription = await subscriptionservice.createSubscription(body, options);
  return res.status(httpStatus.CREATED).send({ results: Subscription });
});

export const list = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const Subscription = await subscriptionservice.getSubscription(filter, options);
  return res.status(httpStatus.OK).send({ results: Subscription });
});

export const update = catchAsync(async (req, res) => {
  const { subscriptionId } = req.params;
  const { body } = req;
  console.log('======body', body);
  console.log('======body', req.admin);
  body.updatedBy = req.admin;

  const filter = {
    _id: subscriptionId,
  };
  const options = { new: true };
  const Subscription = await subscriptionservice.updateSubscription(filter, body, options);
  return res.status(httpStatus.OK).send({ results: Subscription });
});
