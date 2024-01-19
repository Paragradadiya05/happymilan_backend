import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

export const create = {
  body: Joi.object().keys({
    userId: Joi.objectId().required(),
    question: Joi.string().required(),
    options: Joi.array()
      .items(
        Joi.object().keys({
          option: Joi.string().required(),
          isSelected: Joi.boolean().required(),
        })
      )
      .required(),
  }),
};

export const updatePrivacy = {
  userId: Joi.objectId().required(),
  params: Joi.object().keys({
    privacyId: Joi.objectId().required(),
  }),
  body: Joi.object().keys({
    question: Joi.string().required(),
    options: Joi.array()
      .items(
        Joi.object().keys({
          option: Joi.string().required(),
          isSelected: Joi.boolean().required(),
        })
      )
      .required(),
  }),
};
