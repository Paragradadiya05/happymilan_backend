const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

// eslint-disable-next-line import/prefer-default-export
export const createOrder = {
  body: Joi.object().keys({
    planId: Joi.objectId().required(),
  }),
};

export const orderComplete = {
  query: Joi.object().keys({
    razorpay_payment_id: Joi.objectId().required(),
    paymentHistoryToken: Joi.string().required(),
  }),
};
