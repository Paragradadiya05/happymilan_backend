import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { subscriptionservice } from '../../services';

// eslint-disable-next-line import/prefer-default-export
export const getUserSubscription = catchAsync(async (req, res) => {
  const user = req.user._id;
  const filter = {
    user,
  };
  const options = {};
  const subscription = await subscriptionservice.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: subscription });
});
