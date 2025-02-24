import Joi from 'joi';
import { EnumAppUsesTypeOfUsers } from '../../models/enum.model';

Joi.objectId = require('joi-objectid')(Joi);

export const createSpamUser = {
  body: Joi.object().keys({
    userId: Joi.objectId(),
    spamUserId: Joi.objectId().required(),
    reason: Joi.string(),
    remark: Joi.string(),
  }),
  query: Joi.object()
    .keys({
      appUsesType: Joi.string()
        .valid(...Object.values(EnumAppUsesTypeOfUsers))
        .optional(),
    })
    .unknown(true),
};

export const getSpamUser = {
  body: Joi.object().keys({}).unknown(true),
};

export const updateSpam = {
  params: Joi.object().keys({
    spamId: Joi.objectId().required(),
  }),
  body: Joi.object().keys({
    userId: Joi.objectId(),
    spamUserId: Joi.objectId().required(),
    reason: Joi.string(),
    remark: Joi.string(),
  }),
};

export const deleteSpamById = {
  params: Joi.object().keys({
    spamId: Joi.objectId().required(),
  }),
};
