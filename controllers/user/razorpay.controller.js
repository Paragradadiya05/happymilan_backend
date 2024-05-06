import { catchAsync } from '../../utils/catchAsync';

const razorpay = require('razorpay');

// eslint-disable-next-line new-cap
const razorpayInstance = new razorpay({
  key_id: 'YOUR_KEY_ID',
  key_secret: 'YOUR_KEY_SECRET',
});
// eslint-disable-next-line import/prefer-default-export
export const complete = catchAsync(async (req, res) => {
  // Fetch payment details from Razorpay using the payment ID
  const paymentDocument = await razorpayInstance.payments.fetch(req.body.razorpay_payment_id);

  // Check if payment status is captured
  if (paymentDocument.status === 'captured') {
    res.send('Payment Successful');
  } else {
    // Redirect to homepage if payment status is not captured
    res.redirect('/');
  }
});

export const createOrder = catchAsync(async (req, res) => {
  // Set options for creating the order
  const options = {
    amount: 500 * 100,
    currency: 'INR',
    receipt: 'order_rcptid_11',
  };

  // Create an order using Razorpay API
  const order = await razorpayInstance.orders.create(options);
  console.log('Order created:', order);
  res.json(order);
});
