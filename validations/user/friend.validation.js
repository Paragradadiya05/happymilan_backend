import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

export const createFriend = {
  body: Joi.object().keys({}),
};

export const updateFriend = {
  body: Joi.object().keys({}),
  params: Joi.object().keys({
    testId: Joi.objectId().required(),
  }),
};

export const getFriendById = {
  params: Joi.object().keys({
    testId: Joi.objectId().required(),
  }),
};

export const deleteFriendById = {
  params: Joi.object().keys({
    testId: Joi.objectId().required(),
  }),
};

export const getFriend = {
  body: Joi.object().keys({}).unknown(true),
};

export const paginatedFriend = {
  body: Joi.object().keys({}).unknown(true),
  query: Joi.object()
    .keys({
      page: Joi.number().default(1),
      limit: Joi.number().default(10).max(100),
    })
    .unknown(true),
};
