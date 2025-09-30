import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { planservice } from '../../services';

export const createPlan = catchAsync(async (req, res) => {
  const options = {};
  const plan = await planservice.createPlan(req.body, options);
  return res.status(httpStatus.OK).send({ results: plan });
});

export const listPlan = catchAsync(async (req, res) => {
  const filter = {};
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
export const update = catchAsync(async (req, res) => {
  const { body } = req;
  body.updatedBy = req.admin;
  const { planId } = req.params;
  const filter = {
    _id: planId,
  };
  const options = { new: true };
  const plan = await planservice.updatePlan(filter, body, options);
  return res.status(httpStatus.OK).send({ results: plan });
});

export const Delete = catchAsync(async (req, res) => {
  const { planId } = req.params;
  const filter = {
    _id: planId,
  };
  const plan = await planservice.removeplan(filter);
  return res.status(httpStatus.OK).send({ results: plan });
});

export const deleteSelectedPlans = catchAsync(async (req, res) => {
  const { planIds } = req.body; // Expecting an array of plan IDs

  if (!Array.isArray(planIds) || planIds.length === 0) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: 'planIds must be a non-empty array' });
  }

  const deletedPlans = await planservice.removeSelectedPlans(planIds);

  return res.status(httpStatus.OK).send({ message: 'Selected plans deleted successfully', results: deletedPlans });
});

export const getPlanById = catchAsync(async (req, res) => {
  const { planId } = req.params;
  const options = {};
  const plan = await planservice.getPlanById(planId, options);
  return res.status(httpStatus.OK).send({ results: plan });
});
