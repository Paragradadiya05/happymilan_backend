import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

export const createNotification = {
  body: Joi.object().keys({
    title: Joi.string(),
    body: Joi.string(),
    userId: Joi.objectId(),
    otherUserId: Joi.objectId(),
  }),
};

export const getNotification = {
  params: Joi.object().keys({}),
};

export const getNotificationById = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
};

export const updateNotification = {
  params: Joi.object().keys({
    notificationId: Joi.objectId().required(),
  }),
  body: Joi.object().keys({
    title: Joi.string(),
    body: Joi.string(),
    userId: Joi.objectId(),
    otherUserId: Joi.objectId(),
    read: Joi.boolean(),
  }),
};
export const deleteNotification = {
  params: Joi.object().keys({
    notificationId: Joi.objectId().required(),
  }),
};

export const getNotificationId = {
  params: Joi.object().keys({
    notificationId: Joi.objectId().required(),
  }),
};
