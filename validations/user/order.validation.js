const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

// eslint-disable-next-line import/prefer-default-export
export const createOrder = {
  body: Joi.object().keys({
    planId: Joi.objectId().required(),
  }),
};
