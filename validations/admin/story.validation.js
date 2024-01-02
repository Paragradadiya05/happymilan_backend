import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

export const createStory = {
  body: Joi.object().keys({
    images: Joi.any().required(),
    content: Joi.string().required(),
    title: Joi.string().required(),
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
  body: Joi.object().keys({}).unknown(true),
};
