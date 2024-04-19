import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

// eslint-disable-next-line import/prefer-default-export
export const createMessage = {
  body: Joi.object().keys({
    from: Joi.objectId().required(),
    to: Joi.objectId().required(),
    type: Joi.string(),
    message: Joi.string().required(),
  }),
};
export const getMessage = {
  body: Joi.object().keys({
    loginUser: Joi.objectId().required(),
    otherUser: Joi.objectId().required(),
  }),
};
export const getMessagePaginated = {
  params: Joi.object().keys({
    userId: Joi.objectId(),
  }),
  query: Joi.object()
    .keys({
      page: Joi.number().default(1),
      limit: Joi.number().default(15).max(100),
    })
    .unknown(true),
};
