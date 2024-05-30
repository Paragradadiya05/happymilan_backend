import { paymentHistoryService, planservice } from 'services';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import ApiError from '../../utils/ApiError';

const razorpay = require('razorpay');

// eslint-disable-next-line new-cap
const razorpayInstance = new razorpay({
  key_id: 'rzp_test_Dv5ALfzUvZ12UN',
  key_secret: 'REHhueTzlSuxPIsTTPBMyOWG',
});
// eslint-disable-next-line import/prefer-default-export
export const complete = catchAsync(async (req, res) => {
  // Fetch payment details from Razorpay using the payment ID
  const paymentDocument = await razorpayInstance.payments.fetch(req.body.razorpay_payment_id);

  // update payment order data if payment is payment
  // successfully and create user current plan with calculation of date

  // Check if payment status is captured
  if (paymentDocument.status === 'captured') {
    const updatePaymentHistory = await paymentHistoryService.updatePaymentHistory(
      {}, // update filter from here
      {
        razorpayLatestResponse: paymentDocument,
        $push: {
          razorpayResponses: paymentDocument,
        },
      },
      {
        new: true,
      }
    );
    console.log(' == updated payment data == ', updatePaymentHistory);

    // update user plan here

    res.send('Payment Successful');
  } else {
    // todo : handle error here with help of fe side and also update payment
    // Redirect to homepage if payment status is not captured
    res.redirect('/');
  }
});

export const createOrder = catchAsync(async (req, res) => {
  const { planId } = req.body;

  // take userid from auh middleware
  // we get plan id in order section for create order
  const getPlan = await planservice.getPlan({
    _id: planId,
  });

  // todo : also validate that from witch platform this plan belongs
  //  to that platform ( business portal dynamic pllan or plan that made by happymilan metrompny site)
  // verify plan details based on plan id
  if (!getPlan) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No such Plan Available');
  }

  console.log(' === get plan ===', getPlan);
  // based on request we need to calculate amount and currency from plan
  const orderAmount = (getPlan.price - (getPlan.price * getPlan.discount) / 100) * 100;

  // create payment order in our database
  const createPaymentOrder = await paymentHistoryService.createPaymentHistory({
    userId: '6641ccc92df11e1df4acea9f', // todo : update userd id based in auth token currently it is static
    amount: orderAmount, // order amount in rupee * 100 ( paisa )
    paymentMethod: 'razerpay', // update after data coming from razor pay
    stauts: 'created-our-side',
  });

  // Set options for creating the order
  const options = {
    // plan prise - discount prise => will get price that will be taken from user account
    amount: orderAmount,
    currency: 'INR',
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

  return res.status(httpStatus.OK).send({ results: razorPayOrder });
});
