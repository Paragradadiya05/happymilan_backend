import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

export const createShortlist = {
  body: Joi.object().keys({
    shortlistId: Joi.objectId().required(),
  }),
};
export const GetShortlist = {
  body: Joi.object().keys({}).unknown(true),
};
export const GetShortlistByUser = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
};
export const deleteShortlistByUser = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
};
