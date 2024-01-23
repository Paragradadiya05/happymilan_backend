import Joi from 'joi';

export const searchAge = {
  body: Joi.object().keys({
    minAge: Joi.number(),
    maxAge: Joi.number(),
  }),
};

export const update = {
  params: Joi.object().keys({}),
};
