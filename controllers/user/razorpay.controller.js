import { paymentHistoryService, planservice, userPlanService } from 'services';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import config from 'config/config';
import { catchAsync } from '../../utils/catchAsync';
import ApiError from '../../utils/ApiError';
import { EnumOfPlanDuration, EnumOfUserPlan } from '../../models/enum.model';

const razorpay = require('razorpay');

const calculateDates = (planDuration) => {
  const currentDate = new Date();
  const startDate = new Date(currentDate); // Initialize start date as current date
  const endDate = new Date(currentDate); // Initialize end date as current date

  switch (planDuration) {
    case EnumOfPlanDuration.MONTHLY:
      endDate.setMonth(endDate.getMonth() + 1);
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
  // Fetch payment details from Razorpay using the payment ID
  const paymentDocument = await razorpayInstance.payments.fetch(req.body.razorpay_payment_id);

  // Check if payment status is captured
  if (paymentDocument.status === 'captured') {
    // decrypt payment jwt token
    const paymentHistoryToken = jwt.verify(req.query.paymentHistoryToken, 'PAYMENT'); // todo : make this from env

    // todo:get plan here by populate
    const getPaymentHistory = await paymentHistoryService.updatePaymentHistory(
      { _id: paymentHistoryToken.data },
      {
        $set: { status: paymentDocument.status, razorpayLatestResponse: paymentDocument },
        $push: { razorpayResponses: paymentDocument },
      },
      {
        new: true,
        populate: {
          path: 'planId',
        },
      }
    );

    // todo :  make function for calculated date based on plan details.
    const { startDate, endDate } = calculateDates(paymentHistoryToken.data.planDuration);
    await userPlanService.createUserPlan({
      userId: req.user._id,
      planId: getPaymentHistory.planId, // todo : update id here planId
      startDate,
      endDate,
      status: EnumOfUserPlan.ACTIVE,
    });

    // update user plan here
    res.redirect('http://localhost:3000/is-order-complete'); // todo : add url from env here TO: kuldip
  } else {
    // todo : handle error here with help of fe side and also update payment
    // Redirect to homepage if payment status is not captured
    res.redirect('/'); // todo : throw error something went wrong
  }
});

export const createOrder = catchAsync(async (req, res) => {
  const { planId } = req.body;
  const userId = req.user._id;

  // take userid from auh middleware
  // we get plan id in order section for create order
  const getPlan = await planservice.getPlan({
    _id: planId,
  });

  // todo : also validate that from witch platform this plan belongs
  //  to that platform ( business portal dynamic plan or plan that made by happymilan metrompny site)
  // verify plan details based on plan id
  if (!getPlan) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No such Plan Available');
  }

  // based on request, we need to calculate amount and currency from plan
  // const orderAmount = (getPlan.price - (getPlan.price * getPlan.discount) / 100) * 100;
  const orderAmount = 100; // todo : update this after done testing

  // create payment order in our database
  const createPaymentOrder = await paymentHistoryService.createPaymentHistory({
    userId, // todo : update userd id based in auth token currently it is static
    amount: orderAmount, // order amount in rupee * 100 ( paisa )
    paymentMethod: 'razerpay', // update after data coming from razor pay
    stauts: 'created-our-side',
    planId: getPlan._id,
  });

  // Set options for creating the order
  const options = {
    // plan prise - discount prise => will get price that will be taken from a user account
    amount: orderAmount,
    currency: 'INR', // the currency will be dynamic if user wants to change
    receipt: createPaymentOrder._id,
    // todo : check all other options and if some needed in that then we need to integrate it.
  };

  // razor pay create order
  const razorPayOrder = await razorpayInstance.orders.create(options);

  // update order response in out db
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

  const paymentHistoryToken = jwt.sign({ data: createPaymentOrder._id }, 'PAYMENT');

  return res.status(httpStatus.OK).send({ ...razorPayOrder, paymentHistoryToken });
  // return res.status(httpStatus.OK).send({ results: 'ok' });
});
