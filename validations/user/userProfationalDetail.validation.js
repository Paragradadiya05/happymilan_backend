import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);
// Professional
export const createProfessionalDetail = {
  body: Joi.object().keys({
    userId: Joi.objectId(),
    jobTitle: Joi.string(),
    jobType: Joi.string(),
    companyName: Joi.string(),
    currentSalary: Joi.number(),
    workCity: Joi.string(),
    workCountry: Joi.string(),
    currentDesignation: Joi.string(),
  }),
};

export const updateProfessional = {
  body: Joi.object().keys({
    userId: Joi.objectId(),
    jobTitle: Joi.string(),
    jobType: Joi.string(),
    companyName: Joi.string(),
    currentSalary: Joi.number(),
    workCity: Joi.string(),
    workCountry: Joi.string(),
  }),
  params: Joi.object().keys({
    userProfessionalDetailId: Joi.objectId().required(),
  }),
};

export const getProfessionalById = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
};

export const deleteProfessionalById = {
  params: Joi.object().keys({
    userProfessionalDetailId: Joi.objectId().required(),
  }),
};

export const getProfessional = {
  body: Joi.object().keys({}).unknown(true),
};

export const paginatedProfessional = {
  body: Joi.object().keys({}).unknown(true),
  query: Joi.object()
    .keys({
      page: Joi.number().default(1),
      limit: Joi.number().default(10).max(100),
    })
    .unknown(true),
};
