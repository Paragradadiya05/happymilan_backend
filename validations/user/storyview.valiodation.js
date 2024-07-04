import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

export const createview = {
  body: Joi.object().keys({
    statusId: Joi.objectId().required(),
    viewerId: Joi.objectId().required(),
  }),
};

export const paginated = {
  body: Joi.object().keys({}).unknown(true),
  params: Joi.object().keys({
    statusId: Joi.objectId().required(),
  }),
  query: Joi.object()
    .keys({
      page: Joi.number().default(1),
      limit: Joi.number().default(10).max(100),
    })
    .unknown(true),
};
