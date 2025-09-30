import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { planservice } from '../../services';

export const listPlan = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const plan = await planservice.getPlanList(filter, options);
  return res.status(httpStatus.OK).send({ results: plan });
});

export const getPlanById = catchAsync(async (req, res) => {
  const { planId } = req.params;
  const options = {};
  const plan = await planservice.getPlanById(planId, options);
  return res.status(httpStatus.OK).send({ results: plan });
});

export const getPlanByName = catchAsync(async (req, res) => {
  const { planName } = req.params;
  const filter = { planName };
  const options = {};
  const plan = await planservice.getPlanList(filter, options);
  return res.status(httpStatus.OK).send({ results: plan });
});

export const listPlanDating = catchAsync(async (req, res) => {
  const filter = { isDating: true };
  const options = {};
  const plan = await planservice.getPlanList(filter, options);
  return res.status(httpStatus.OK).send({ results: plan });
});
