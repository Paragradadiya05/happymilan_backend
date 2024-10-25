import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

export const createStory = {
  body: Joi.object().keys({
    partnerUserId: Joi.objectId().required(),
    images: Joi.any().required(),
    content: Joi.string().required(),
    title: Joi.string().required(),
    marriageDate: Joi.string(),
  }),
};

export const updateStory = {
  params: Joi.object().keys({
    storyId: Joi.objectId().required(),
  }),
  body: Joi.object().keys({
    images: Joi.any().required(),
    content: Joi.string().required(),
    title: Joi.string().required(),
  }),
};

export const deleteStoryById = {
  params: Joi.object().keys({
    storyId: Joi.objectId().required(),
  }),
};

export const getStory = {
  query: Joi.object()
    .keys({
      page: Joi.number().default(1),
      limit: Joi.number().default(10).max(100),
    })
    .unknown(true),
};

export const verifyStoryConsent = {
  query: Joi.object().keys({
    consentToken: Joi.string().required(),
  }),
};
