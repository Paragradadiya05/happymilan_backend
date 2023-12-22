import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

// eslint-disable-next-line import/prefer-default-export
export const createMessage = {
  body: Joi.object().keys({
    from: Joi.objectId().required(),
    to: Joi.objectId().required(),
    message: Joi.string().required(),
  }),
};
