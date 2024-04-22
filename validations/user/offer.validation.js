import enumFields from 'models/enum.model';

const Joi = require('joi');

export const createOffer = {
  body: Joi.object().keys({
    type: Joi.string()
      .valid(...Object.values(enumFields.EnumOfOffer))
      .required(),
    name: Joi.string(),
    details: Joi.string(),
    date: Joi.string(),
    other: Joi.string(),
  }),
};

export const GetOffer = {};
