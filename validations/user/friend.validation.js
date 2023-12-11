import Joi from 'joi';
import enumFields from 'models/enum.model';

Joi.objectId = require('joi-objectid')(Joi);

export const createFriend = {
  body: Joi.object().keys({
    friend: Joi.objectId().required(),
    user: Joi.objectId().required(),
    status: Joi.string().valid(...Object.values(enumFields.EnumStatusOfFriend)),
  }),
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

export const respondFriendRequest = {
  body: Joi.object().keys({
    user: Joi.objectId().required(),
    request: Joi.objectId().required(),
    status: Joi.string().valid(...Object.values(enumFields.EnumStatusOfFriend)),
  }),
};
export const getFriendreqById = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
};

export const getblockedById = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
};
export const getsendedreqById = {
  params: Joi.object().keys({
    frindId: Joi.objectId().required(),
  }),
};
