import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

export const createLike = {
  body: Joi.object().keys({
    likedUserId: Joi.objectId().required(),
    isLike: Joi.boolean().required(),
  }),
};
export const GetLikes = {};

export const DeleteLike = {
  params: Joi.object().keys({
    likeId: Joi.objectId().required(),
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
};

export const paginatedStatus = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
  query: Joi.object()
    .keys({
      page: Joi.number().default(1),
      limit: Joi.number().default(10).max(100),
    })
    .unknown(true),
};
