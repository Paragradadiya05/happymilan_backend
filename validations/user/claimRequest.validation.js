import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

export const createClaim = {
  body: Joi.object().keys({
    vendorId: Joi.objectId().required(),
    businessName: Joi.string().required(),
    city: Joi.string().required(),
    fullName: Joi.string().required(),
    mobileNumber: Joi.string().required(),
    email: Joi.string().email().required(),
    role: Joi.string().required(),
    documentProof: Joi.string().required(),
  }),
};

export const getClaimById = {
  params: Joi.object().keys({
    requestId: Joi.objectId().required(),
  }),
};

export const paginatedClaims = {
  query: Joi.object()
    .keys({
      page: Joi.number().default(1),
      limit: Joi.number().default(10).max(100),
      status: Joi.string().valid('pending', 'approved', 'rejected').optional(),
    })
    .unknown(true),
};

export const verifyClaim = {
  params: Joi.object().keys({
    requestId: Joi.objectId().required(),
  }),
  body: Joi.object().keys({
    status: Joi.string().valid('approved', 'rejected').required(),
    rejectionReason: Joi.string().when('status', {
      is: 'rejected',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  }),
};
