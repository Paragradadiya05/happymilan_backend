import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { userPlanService } from '../../services';
import { UserPlan } from '../../models';

export const getUserPlanId = catchAsync(async (req, res) => {
  const userId = req.user._id;

  const filter = { userId };
  const options = {};
  const userPlan = await userPlanService.getOne(filter, options);

  if (!userPlan) {
    return res.status(httpStatus.NOT_FOUND).send({ message: 'User plan not found' });
  }

  const currentDate = new Date();

  // If the end date has passed and status is still active, mark it as inactive
  if (userPlan.endDate && userPlan.endDate < currentDate && userPlan.status !== 'inactive') {
    userPlan.status = 'inactive';
    await UserPlan.save();
  }

  return res.status(httpStatus.OK).send({ results: userPlan });
});

export const list = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const address = await userPlanService.getUserPlanList(filter, options);
  return res.status(httpStatus.OK).send({ results: address });
});
