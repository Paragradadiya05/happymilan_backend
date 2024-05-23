import Joi from 'joi';
import enumModel from '../../models/enum.model';

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
    country: Joi.array()
      .items(Joi.string().valid(...Object.values(enumModel.EnumOfCountry)))
      .required(),
    state: Joi.array()
      .items(Joi.string().valid(...Object.values(enumModel.EnumOfState)))
      .required(),
    city: Joi.array().items(Joi.string()).required(),
    income: Joi.string().required(),
    creative: Joi.array()
      .items(Joi.string().valid(...Object.values(enumModel.EnumOfCreative)))
      .required(),
    fun: Joi.array().items(Joi.string()).required(),
    diet: Joi.array()
      .items(Joi.string().valid(...Object.values(enumModel.EnumOfDiet)))
      .required(),
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
    country: Joi.array()
      .items(Joi.string().valid(...Object.values(enumModel.EnumOfCountry)))
      .required(),
    state: Joi.array()
      .items(Joi.string().valid(...Object.values(enumModel.EnumOfState)))
      .required(),
    city: Joi.array().items(Joi.string()).required(),
    income: Joi.string().required(),
    creative: Joi.array()
      .items(Joi.string().valid(...Object.values(enumModel.EnumOfCreative)))
      .required(),
    fun: Joi.array().items(Joi.string()).required(),
    diet: Joi.array()
      .items(Joi.string().valid(...Object.values(enumModel.EnumOfDiet)))
      .required(),
  }),
};

export const getPartnerpreById = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
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

export const getById = {
  params: Joi.object().keys({
    PartnerId: Joi.objectId().required(),
  }),
};
