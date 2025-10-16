import httpStatus from 'http-status';
import { catchAsync } from 'utils/catchAsync';
import { cancelPlanService } from '../../services';
import { Credit, Subscription, User, UserPlan } from '../../models';
import { sendCancelPlanApprovedEmail, sendCancelPlanRejectedEmail } from '../../services/email.service';

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

  if (!cancelPlan) {
    return res.status(httpStatus.NOT_FOUND).send({ message: 'CancelPlan not found' });
  }

  // Get user details for email
  const user = await User.findById(cancelPlan.userId).select('email firstName');

  // 👉 If approved
  if (cancelPlan.status === 'approved') {
    await UserPlan.findByIdAndUpdate(cancelPlan.userPlanId, { status: 'inactive' });
    await Credit.findOneAndUpdate({ userId: cancelPlan.userId }, { creditBalance: 0 }, { new: true });
    await Subscription.findOneAndUpdate({ userId: cancelPlan.userId }, { status: 'inactive' }, { new: true });

    // Send approved email
    if (user) await sendCancelPlanApprovedEmail(user, cancelPlan);
  }

  // 👉 If rejected
  if (cancelPlan.status === 'rejected') {
    if (user) await sendCancelPlanRejectedEmail(user, cancelPlan);
  }

  res.status(httpStatus.OK).send(cancelPlan);
});

export const deleteCancelPlan = catchAsync(async (req, res) => {
  const { cancelPlanId } = req.params;
  const cancelPlan = await cancelPlanService.removeCancelPlan({ _id: cancelPlanId });
  res.status(httpStatus.NO_CONTENT).send(cancelPlan);
});

export const getCancelPlanList = catchAsync(async (req, res) => {
  const options = {
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 10,
    sort: { createdAt: -1 },
    populate: [{ path: 'userPlanId' }, { path: 'planId' }, { path: 'userId', select: 'name email userUniqueId' }],
    lean: true, // gives plain JS objects instead of mongoose docs
  };

  const result = await cancelPlanService.getCancelPlanPaginete({}, options);

  res.send({
    data: result,
  });
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
