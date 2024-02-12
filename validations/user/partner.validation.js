import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);
// Professional
export const createPartnerpre = {
  body: Joi.object().keys({
    userId: Joi.objectId(),
    age: Joi.object({
      min: Joi.number().required(),
      max: Joi.number().required(),
    }),
    height: Joi.object({
      min: Joi.number().required(),
      max: Joi.number().required(),
    }),
    country: Joi.string().required(),
    state: Joi.string().required(),
    city: Joi.string().required(),
    income: Joi.string().required(),
    creative: Joi.string().required(),
    fun: Joi.string().required(),
    diet: Joi.string().required(),
  }),
};

export const updatePartnerpre = {
  body: Joi.object().keys({
    userId: Joi.objectId(),
    age: Joi.object({
      min: Joi.number().required(),
      max: Joi.number().required(),
    }),
    height: Joi.object({
      min: Joi.number().required(),
      max: Joi.number().required(),
    }),
    country: Joi.string().required(),
    state: Joi.string().required(),
    city: Joi.string().required(),
    income: Joi.string().required(),
    creative: Joi.string().required(),
    fun: Joi.string().required(),
    diet: Joi.string().required(),
  }),
  params: Joi.object().keys({
    PartnerId: Joi.objectId().required(),
  }),
};

export const getPartnerpreById = {
  params: Joi.object().keys({
    PartnerId: Joi.objectId().required(),
  }),
};

export const deletePartnerpreById = {
  params: Joi.object().keys({
    PartnerId: Joi.objectId().required(),
  }),
};

export const getPartnerpre = {
  body: Joi.object().keys({}).unknown(true),
};
