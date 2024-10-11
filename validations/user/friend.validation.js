import Joi from 'joi';
import enumFields, { EnumAppUsesTypeOfUsers } from 'models/enum.model';

Joi.objectId = require('joi-objectid')(Joi);

export const createFriend = {
  body: Joi.object().keys({
    friend: Joi.objectId().required(),
    user: Joi.objectId().required(),
    status: Joi.string().valid(...Object.values(enumFields.EnumStatusOfFriend)),
  }),
  query: Joi.object().keys({
    appUsesType: Joi.string()
      .valid(...Object.values(EnumAppUsesTypeOfUsers))
      .optional(),
  }),
};

export const updateFriend = {
  body: Joi.object().keys({}),
  params: Joi.object().keys({
    friendId: Joi.objectId().required(),
  }),
  query: Joi.object().keys({
    appUsesType: Joi.string()
      .valid(...Object.values(EnumAppUsesTypeOfUsers))
      .optional(),
  }),
};

export const getFriendById = {
  params: Joi.object().keys({
    friendId: Joi.objectId().required(),
  }),
  query: Joi.object().keys({
    appUsesType: Joi.string()
      .valid(...Object.values(EnumAppUsesTypeOfUsers))
      .optional(),
  }),
};

export const deleteFriendById = {
  params: Joi.object().keys({
    friendId: Joi.objectId().required(),
  }),
  query: Joi.object().keys({
    appUsesType: Joi.string()
      .valid(...Object.values(EnumAppUsesTypeOfUsers))
      .optional(),
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
  query: Joi.object().keys({
    appUsesType: Joi.string()
      .valid(...Object.values(EnumAppUsesTypeOfUsers))
      .optional(),
  }),
};

export const getMyFrdRequestsMobile = {
  query: Joi.object()
    .keys({
      page: Joi.number().default(1),
      limit: Joi.number().default(10).max(100),
    })
    .unknown(true),
};

export const appUsesTypeValidation = {
  query: Joi.object().keys({
    appUsesType: Joi.string()
      .valid(...Object.values(EnumAppUsesTypeOfUsers))
      .optional(),
  }),
};
export const getRequestedFriendv2 = {
  query: Joi.object().keys({
    appUsesType: Joi.string()
      .valid(...Object.values(EnumAppUsesTypeOfUsers))
      .optional(),
    page: Joi.number().default(1),
    limit: Joi.number().default(10).max(100),
  }),
};
