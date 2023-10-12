import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);
// Professional
export const createProfessionalDetail = {
  body: Joi.object().keys({}),
};

export const updateProfessional = {
  body: Joi.object().keys({}),
  params: Joi.object().keys({
    testId: Joi.objectId().required(),
  }),
};

export const getProfessionalById = {
  params: Joi.object().keys({
    testId: Joi.objectId().required(),
  }),
};

export const deleteProfessionalById = {
  params: Joi.object().keys({
    testId: Joi.objectId().required(),
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
