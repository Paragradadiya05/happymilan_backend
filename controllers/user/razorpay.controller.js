import {
  emailService,
  paymentHistoryService,
  planservice,
  subscriptionservice,
  userPlanService,
  creditService,
} from 'services';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import config from 'config/config';
import { catchAsync } from '../../utils/catchAsync';
import ApiError from '../../utils/ApiError';
import { EnumOfPlanDuration, EnumOfStatus, EnumOfUserPlan } from '../../models/enum.model';

const razorpay = require('razorpay');

const calculateDates = (planDuration) => {
  const currentDate = new Date();
  const startDate = new Date(currentDate); // Initialize start date as current date
  const endDate = new Date(currentDate); // Initialize end date as current date

  switch (planDuration) {
    case EnumOfPlanDuration.MONTHLY:
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case EnumOfPlanDuration.TWO_MONTHLY:
      endDate.setMonth(endDate.getMonth() + 2);
      break;
    case EnumOfPlanDuration.THREE_MONTHLY:
      endDate.setMonth(endDate.getMonth() + 3);
      break;
    case EnumOfPlanDuration.YEARLY:
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    case EnumOfPlanDuration.QUARTERLY:
      endDate.setMonth(endDate.getMonth() + 3);
      break;
    case EnumOfPlanDuration.BIANNUAL:
      endDate.setMonth(endDate.getMonth() + 6);
      break;
    default:
      // Handle unsupported plan durations or defaults to a reasonable duration
      endDate.setMonth(endDate.getMonth() + 1); // Default to monthly if none specified
      break;
  }

  return { startDate, endDate };
};

// eslint-disable-next-line new-cap
const razorpayInstance = new razorpay({
  key_id: config.razorpay.key_id,
  key_secret: config.razorpay.key_secret,
});
// eslint-disable-next-line import/prefer-default-export
export const complete = catchAsync(async (req, res) => {
  if (!req.body.razorpay_payment_id || !req.query.paymentHistoryToken) {
    throw new ApiError(httpStatus.NOT_FOUND, 'razorpay_payment_id Not Available');
  }

  const paymentDocument = await razorpayInstance.payments.fetch(req.body.razorpay_payment_id);
  const paymentMethod = paymentDocument.method;

  if (paymentDocument.status === 'captured') {
    const paymentHistoryToken = jwt.verify(req.query.paymentHistoryToken, 'PAYMENT');

    const getPaymentHistory = await paymentHistoryService.updatePaymentHistory(
      { _id: paymentHistoryToken.data },
      {
        $set: { status: paymentDocument.status, razorpayLatestResponse: paymentDocument, paymentMethod },
        $push: { razorpayResponses: paymentDocument },
      },
      {
        new: true,
        populate: [{ path: 'planId' }, { path: 'userId', select: 'email fullName' }],
      }
    );

    const populatedPlan = getPaymentHistory.planId;
    const user = getPaymentHistory.userId || req.user;
    const { startDate, endDate } = calculateDates(paymentHistoryToken.data.planDuration);

    // Create subscription
    await subscriptionservice.createSubscription({
      user: req.user._id,
      selectedPlan: populatedPlan.planName,
      startDate,
      endDate,
      status: EnumOfStatus.ACTIVE,
    });

    await userPlanService.createUserPlan({
      userId: req.user._id,
      planId: getPaymentHistory.planId,
      startDate,
      endDate,
      paymentMethod,
      status: EnumOfUserPlan.ACTIVE,
    });

    // Handle credits
    try {
      const userId = req.user._id;
      const planId = getPaymentHistory.planId._id;
      const creditAmount = populatedPlan.allowNumberOfRequest || 0;

      await creditService.resetCredits({ userId, reason: 'Plan Purchase', planId });
      await creditService.addCredits({
        userId,
        amount: creditAmount,
        reason: 'Plan Purchase',
        planId,
        notes: `Added ${creditAmount} credits for plan purchase: ${populatedPlan.planName}`,
      });
    } catch (e) {
      console.error('Credit update failed:', e);
    }

    // Send confirmation email
    try {
      await emailService.sendPlanConfirmationEmail({
        email: user.email,
        name: user.fullName || user.name || 'User',
        planName: populatedPlan.planName,
        startDate,
        endDate,
        price: populatedPlan.totalPrice,
      });
    } catch (e) {
      console.error('Email send failed:', e);
    }

    // ✅ Detect platform via query
    const isMobile = req.query.type === 'mobile';

    if (isMobile) {
      // Mobile: send JSON response
      return res.status(httpStatus.OK).json({
        status: 'success',
        message: 'Payment completed successfully',
        redirectUrl: `${config.frontendUrl}${config.paymentPath}`,
        plan: populatedPlan.planName,
        startDate,
        endDate,
      });
    }
    // Web: redirect
    return res.redirect(`${config.frontendUrl}${config.paymentPath}`);
  }
  return res.status(httpStatus.BAD_REQUEST).json({
    status: 'fail',
    message: 'Payment not captured. Please try again.',
  });
});

export const createOrder = catchAsync(async (req, res) => {
  try {
    console.log('========== CREATE ORDER START ==========');

    console.log('req.user =>', req.user);
    console.log('req.body =>', req.body);

    const { planId } = req.body;
    const userId = req.user && req.user._id;

    console.log('userId =>', userId);
    console.log('planId =>', planId);

    const getPlan = await planservice.getPlan({
      _id: planId,
    });

    console.log('getPlan =>', getPlan);

    if (!getPlan) {
      console.log('PLAN NOT FOUND');
      throw new ApiError(httpStatus.NOT_FOUND, 'No such Plan Available');
    }

    const orderAmount = 100;
    console.log('orderAmount =>', orderAmount);

    const createPaymentOrder = await paymentHistoryService.createPaymentHistory({
      userId,
      amount: orderAmount,
      paymentMethod: 'razerpay',
      stauts: 'created-our-side',
      planId: getPlan._id,
    });

    console.log('createPaymentOrder =>', createPaymentOrder);

    const options = {
      amount: orderAmount,
      currency: 'INR',
      receipt: createPaymentOrder._id,
    };

    console.log('Razorpay Options =>', options);

    const razorPayOrder = await razorpayInstance.orders.create(options);

    console.log('razorPayOrder =>', razorPayOrder);

    await paymentHistoryService.updatePaymentHistory(
      {
        _id: createPaymentOrder._id,
      },
      {
        razorpayLatestResponse: razorPayOrder,
        $push: {
          razorpayResponses: razorPayOrder,
        },
      }
    );

    console.log('Payment History Updated');

    const paymentHistoryToken = jwt.sign({ data: createPaymentOrder._id }, 'PAYMENT');

    console.log('Token Generated');
    console.log('========== CREATE ORDER SUCCESS ==========');

    return res.status(httpStatus.OK).send({ ...razorPayOrder, paymentHistoryToken });
  } catch (error) {
    console.log('========== CREATE ORDER ERROR ==========');
    console.log(error);
    console.log('Message =>', error.message);
    console.log('Status =>', error.statusCode);
    console.log('========================================');

    throw error;
  }
});
