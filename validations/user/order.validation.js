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
    paymentHistoryToken: Joi.string().required(),
    authToken: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      razorpay_payment_id: Joi.string().required(),
    })
    .unknown(true),
};
