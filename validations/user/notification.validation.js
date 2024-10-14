import Joi from 'joi';
import { EnumAppUsesTypeOfUsers } from '../../models/enum.model';

Joi.objectId = require('joi-objectid')(Joi);

export const createNotification = {
  body: Joi.object().keys({
    title: Joi.string(),
    body: Joi.string(),
    userId: Joi.objectId(),
    otherUserId: Joi.objectId(),
  }),
  query: Joi.object().keys({
    appUsesType: Joi.string()
      .valid(...Object.values(EnumAppUsesTypeOfUsers))
      .optional(),
  }),
};

export const getNotification = {
  params: Joi.object().keys({}),
  query: Joi.object().keys({
    appUsesType: Joi.string()
      .valid(...Object.values(EnumAppUsesTypeOfUsers))
      .optional(),
  }),
};

export const getNotificationById = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
  query: Joi.object().keys({
    appUsesType: Joi.string()
      .valid(...Object.values(EnumAppUsesTypeOfUsers))
      .optional(),
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
  query: Joi.object().keys({
    appUsesType: Joi.string()
      .valid(...Object.values(EnumAppUsesTypeOfUsers))
      .optional(),
  }),
};
export const deleteNotification = {
  params: Joi.object().keys({
    notificationId: Joi.objectId().required(),
  }),
  query: Joi.object().keys({
    appUsesType: Joi.string()
      .valid(...Object.values(EnumAppUsesTypeOfUsers))
      .optional(),
  }),
};

export const getNotificationId = {
  params: Joi.object().keys({
    notificationId: Joi.objectId().required(),
  }),
  query: Joi.object().keys({
    appUsesType: Joi.string()
      .valid(...Object.values(EnumAppUsesTypeOfUsers))
      .optional(),
  }),
};
