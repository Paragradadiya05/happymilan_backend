import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);
// Professional
export const createEducationDetail = {
  body: Joi.object().keys({
    userId: Joi.objectId(),
    degree: Joi.string(),
    collage: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    country: Joi.string(),
  }),
};

export const updateEducation = {
  body: Joi.object().keys({
    degree: Joi.string(),
    collage: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    country: Joi.string(),
  }),
  params: Joi.object().keys({
    userEducationDetailId: Joi.objectId().required(),
  }),
};

export const getEducationById = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
};

export const deleteEducationById = {
  params: Joi.object().keys({
    userEducationDetailId: Joi.objectId().required(),
  }),
};

export const getEducation = {
  body: Joi.object().keys({}).unknown(true),
};
