import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { planservice } from '../../services';

const listPlan = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const plan = await planservice.getPlanList(filter, options);
  return res.status(httpStatus.OK).send({ results: plan });
});

module.exports = {
  listPlan,
};
