import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

export const createStatus = {
  body: Joi.object().keys({
    content: Joi.string().required(),
  }),
};
export const getStatus = {
  body: Joi.object().keys({}).unknown(true),
};
