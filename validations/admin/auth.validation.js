import Joi from 'joi';

export const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string(),
    name: Joi.string().required(),
    role: Joi.string(),
    mobileNumber: Joi.number(),
  }),
};

export const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
    deviceToken: Joi.string().allow(''),
  }),
};

export const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

export const update = {
  body: Joi.object().keys({}).unknown(true),
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
};
