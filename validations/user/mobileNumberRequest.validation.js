import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

export const createMobileNumberRequest = {
  body: Joi.object().keys({
    targetUserId: Joi.objectId().required(),
  }),
};

export const acceptMobileNumberRequest = {
  params: Joi.object().keys({
    requestId: Joi.objectId().required(),
  }),
};

export const rejectMobileNumberRequest = {
  params: Joi.object().keys({
    requestId: Joi.objectId().required(),
  }),
};

export const getRequests = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    status: Joi.string().valid('pending', 'accepted', 'rejected').optional(),
  }),
};
