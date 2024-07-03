import Joi from 'joi';
import enumFields from '../../models/enum.model';

Joi.objectId = require('joi-objectid')(Joi);

export const createSpamUser = {
  body: Joi.object().keys({
    userId: Joi.objectId(),
    spamUserId: Joi.objectId().required(),
    reason: Joi.string().valid(...Object.values(enumFields.EnumOfReason)),
    remark: Joi.string(),
  }),
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
    reason: Joi.string().valid(...Object.values(enumFields.EnumOfReason)),
    remark: Joi.string(),
  }),
};

export const deleteSpamById = {
  params: Joi.object().keys({
    spamId: Joi.objectId().required(),
  }),
};
