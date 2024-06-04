import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

export const createStatus = {
  body: Joi.object().keys({
    content: Joi.string().required(),
    caption: Joi.string(),
  }),
};

export const updateStatus = {
  params: Joi.object().keys({
    statusId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    content: Joi.string().required(),
    caption: Joi.string(),
  }),
};

export const getStatus = {
  body: Joi.object().keys({}).unknown(true),
};
export const deleteStatusById = {
  params: Joi.object().keys({
    statusId: Joi.string().required(),
  }),
};
