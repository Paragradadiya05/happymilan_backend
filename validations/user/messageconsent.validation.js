import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

export const createMessageConsent = {
  body: Joi.object().keys({
    senderId: Joi.objectId().required(),
    receiverId: Joi.objectId().required(),
    primaryConsent: Joi.string(),
    secondaryConsent: Joi.string(),
    report: Joi.object(),
    isBlocked: Joi.boolean(),
  }),
};

export const updateMessageConsent = {
  params: Joi.object().keys({
    messageConsentId: Joi.objectId().required(),
  }),
  body: Joi.object().keys({
    senderId: Joi.objectId().required(),
    receiverId: Joi.objectId().required(),
    primaryConsent: Joi.string(),
    secondaryConsent: Joi.string(),
    report: Joi.object(),
    isBlocked: Joi.boolean(),
  }),
};

export const deleteMessageConsentById = {
  params: Joi.object().keys({
    messageConsentId: Joi.objectId().required(),
  }),
};

export const getMessageConsent = {
  body: Joi.object().keys({}).unknown(true),
};

export const getMessageConsentByReceiverId = {
  params: Joi.object().keys({
    receiverId: Joi.objectId().required(),
  }),
};

export const getConsent = {
  body: Joi.object().keys({}).unknown(true),
};
