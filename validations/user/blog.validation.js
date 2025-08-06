import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

export const createBlog = {
  body: Joi.object().keys({
    title: Joi.string(),
    content: Joi.string(),
    images: Joi.any(),
    status: Joi.boolean(),
    blogType: Joi.string(),
  }),
};

export const updateBlog = {
  params: Joi.object().keys({
    blogId: Joi.objectId().required(),
  }),
  body: Joi.object().keys({
    title: Joi.string(),
    content: Joi.string(),
    images: Joi.any(),
    status: Joi.boolean(),
    blogType: Joi.string(),
  }),
};

export const deleteBlogById = {
  params: Joi.object().keys({
    blogId: Joi.objectId().required(),
  }),
};

export const getBlog = {
  body: Joi.object().keys({}).unknown(true),
};
