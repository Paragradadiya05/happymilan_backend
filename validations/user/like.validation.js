import Joi from 'joi';
import { EnumAppUsesTypeOfUsers } from '../../models/enum.model';

Joi.objectId = require('joi-objectid')(Joi);

export const createLike = {
  body: Joi.object().keys({
    likedUserId: Joi.objectId().required(),
    isLike: Joi.boolean().required(),
  }),
  query: Joi.object().keys({
    appUsesType: Joi.string()
      .valid(...Object.values(EnumAppUsesTypeOfUsers))
      .optional(),
  }),
};
export const GetLikes = {};

export const DeleteLike = {
  params: Joi.object().keys({
    likeId: Joi.objectId().required(),
  }),
  query: Joi.object().keys({
    appUsesType: Joi.string()
      .valid(...Object.values(EnumAppUsesTypeOfUsers))
      .optional(),
  }),
};
export const updateLike = {
  body: Joi.object().keys({
    likedUserId: Joi.objectId().required(),
    isLike: Joi.boolean().required(),
  }),
  params: Joi.object().keys({
    likeId: Joi.objectId().required(),
  }),
};
export const likeData = {
  params: Joi.object().keys({
    likedUserId: Joi.objectId().required(),
  }),
  query: Joi.object().keys({
    appUsesType: Joi.string()
      .valid(...Object.values(EnumAppUsesTypeOfUsers))
      .optional(),
  }),
};

export const paginatedStatus = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
  query: Joi.object()
    .keys({
      page: Joi.number().default(1),
      limit: Joi.number().default(10).max(100),
      appUsesType: Joi.string()
        .valid(...Object.values(EnumAppUsesTypeOfUsers))
        .optional(),
    })
    .unknown(true),
};
