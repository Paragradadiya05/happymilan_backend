import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { userPlanService } from '../../services';

// eslint-disable-next-line import/prefer-default-export
export const getUserPlanId = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const filter = {
    _id: userId,
  };
  const options = {};
  const SearchHistory = await userPlanService.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: SearchHistory });
});
