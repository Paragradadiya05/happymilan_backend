import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

export const createAddress = {
  body: Joi.object().keys({}),
};

export const updateAddress = {
  body: Joi.object().keys({}),
  params: Joi.object().keys({
    testId: Joi.objectId().required(),
  }),
};

export const getAddressById = {
  params: Joi.object().keys({
    testId: Joi.objectId().required(),
  }),
};

export const deleteAddressById = {
  params: Joi.object().keys({
    testId: Joi.objectId().required(),
  }),
};

export const getAddress = {
  body: Joi.object().keys({}).unknown(true),
};

export const paginatedAddress = {
  body: Joi.object().keys({}).unknown(true),
  query: Joi.object()
    .keys({
      page: Joi.number().default(1),
      limit: Joi.number().default(10).max(100),
    })
    .unknown(true),
};
