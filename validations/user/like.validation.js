import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

export const createLike = {
  body: Joi.object().keys({
    likeId: Joi.objectId().required(),
  }),
};
export const GetLikes = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
};

export const DeleteLike = {
  params: Joi.object().keys({
    likeId: Joi.objectId().required(),
  }),
};
