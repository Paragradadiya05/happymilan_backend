import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

export const createBlog = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    content: Joi.string().required(),
    images: Joi.any().required(),
    status: Joi.boolean(),
  }),
};

export const updateBlog = {
  params: Joi.object().keys({
    blogId: Joi.objectId().required(),
  }),
  body: Joi.object().keys({
    title: Joi.string().required(),
    content: Joi.string().required(),
    images: Joi.any().required(),
    status: Joi.boolean(),
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

export const getBlogbyId = {
  params: Joi.object().keys({
    blogId: Joi.objectId().required(),
  }),
};
