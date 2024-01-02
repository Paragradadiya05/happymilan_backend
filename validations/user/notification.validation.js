import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

export const createNotification = {
  body: Joi.object().keys({
    title: Joi.string(),
    body: Joi.string(),
    userId: Joi.objectId(),
    otherUserId: Joi.objectId(),
    read: Joi.string(),
  }),
};

export const getNotification = {
  params: Joi.object().keys({}),
};
