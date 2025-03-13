import Joi from 'joi';

export const verifyTwoFactorAuth = {
  body: Joi.object().keys({
    token: Joi.string().required().length(6).pattern(/^\d+$/).message('Token must be a 6-digit number'),
  }),
};

export const loginWithTwoFactor = {
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      mobileNumber: Joi.string(),
      countryCodeId: Joi.string().when('mobileNumber', {
        is: Joi.exist(),
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
      password: Joi.string().required(),
      twoFactorCode: Joi.string().length(6).pattern(/^\d+$/),
      deviceToken: Joi.string(),
    })
    .xor('email', 'mobileNumber'),
};
