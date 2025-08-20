import httpStatus from 'http-status';
import { catchAsync } from 'utils/catchAsync';
import { cancelPlanService } from '../../services';

export const createCancelPlan = catchAsync(async (req, res) => {
  const cancelPlan = await cancelPlanService.createCancelPlan({
    ...req.body,
    userId: req.user._id, // ✅ take userId from logged-in user
  });
  res.status(httpStatus.CREATED).send(cancelPlan);
});

export const updateCancelPlan = catchAsync(async (req, res) => {
  const { cancelPlanId } = req.params;
  const cancelPlan = await cancelPlanService.updateCancelPlan({ _id: cancelPlanId }, req.body, { new: true });
  res.send(cancelPlan);
});

export const deleteCancelPlan = catchAsync(async (req, res) => {
  const { cancelPlanId } = req.params;
  const cancelPlan = await cancelPlanService.removeCancelPlan({ _id: cancelPlanId });
  res.status(httpStatus.NO_CONTENT).send(cancelPlan);
});

export const getCancelPlanList = catchAsync(async (req, res) => {
  const cancelPlans = await cancelPlanService.getCancelPlanList({});
  res.send(cancelPlans);
});

export const getCancelPlanByUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const cancelPlans = await cancelPlanService.getCancelPlanList({ userId });
  res.send(cancelPlans);
});

export const getCancelPlan = catchAsync(async (req, res) => {
  const { cancelPlanId } = req.params;
  const cancelPlan = await cancelPlanService.getOneCancelPlan({ _id: cancelPlanId });
  res.send(cancelPlan);
});
