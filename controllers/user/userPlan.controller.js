import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { userPlanService } from '../../services';

export const getUserPlanId = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const filter = {
    userId,
  };
  const options = {};
  const user = await userPlanService.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: user });
});

export const list = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const address = await userPlanService.getUserPlanList(filter, options);
  return res.status(httpStatus.OK).send({ results: address });
});
