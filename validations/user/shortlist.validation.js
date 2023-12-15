import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

export const createShortlist = {
  body: Joi.object().keys({
    shortlistId: Joi.objectId().required(),
  }),
};
export const Getshortlist = {
  body: Joi.object().keys({}).unknown(true),
};
