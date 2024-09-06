import Joi from 'joi';
import enumFields from '../../models/enum.model';

Joi.objectId = require('joi-objectid')(Joi);

// export const createTest = {
//   body: Joi.object().keys({
//     createdBy: Joi.objectId().required(),
//     updatedBy: Joi.objectId().required(),
//   }),
// };

// export const updateTest = {
//   body: Joi.object().keys({}),
//   params: Joi.object().keys({
//     testId: Joi.objectId().required(),
//   }),
// };

// eslint-disable-next-line import/prefer-default-export
export const getPlanById = {
  params: Joi.object().keys({
    planId: Joi.objectId().required(),
  }),
};

export const getPlanByName = {
  params: Joi.object().keys({
    planName: Joi.string().valid(...Object.values(enumFields.EnumOfPlan)),
  }),
};
// export const deleteTestById = {
//   params: Joi.object().keys({
//     testId: Joi.objectId().required(),
//   }),
// };

// export const getTest = {
//   body: Joi.object().keys({}).unknown(true),
// };

// export const paginatedTest = {
//   body: Joi.object().keys({}).unknown(true),
//   query: Joi.object()
//     .keys({
//       page: Joi.number().default(1),
//       limit: Joi.number().default(10).max(100),
//     })
//     .unknown(true),
// };
