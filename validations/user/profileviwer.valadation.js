import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

export const createProfileviwer = {
  body: Joi.object().keys({
    viewerId: Joi.objectId().required(),
  }),
};
export const GetProfileviwer = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
};
