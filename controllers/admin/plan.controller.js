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
