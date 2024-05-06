const razorpay = require('razorpay');

// eslint-disable-next-line new-cap
const razorpayInstance = new razorpay({
  key_id: 'YOUR_KEY_ID',
  key_secret: 'YOUR_KEY_SECRET',
});
// eslint-disable-next-line import/prefer-default-export
export const complete = async (req, res) => {
  try {
    // Fetch payment details from Razorpay using the payment ID
    const paymentDocument = await razorpayInstance.payments.fetch(req.body.razorpay_payment_id);

    // Check if payment status is captured
    if (paymentDocument.status === 'captured') {
      res.send('Payment Successful');
    } else {
      // Redirect to homepage if payment status is not capturedexport
      res.redirect('/');
    }
  } catch (error) {
    // Handle any errors that occur during payment verification
    console.error('Error verifying payment:', error);
    res.status(500).send('Error verifying payment');
  }
};
