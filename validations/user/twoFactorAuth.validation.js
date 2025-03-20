import Joi from 'joi';

export const verifyTwoFactorAuth = {
  body: Joi.object().keys({
    token: Joi.string().required().length(6).pattern(/^\d+$/).message('Token must be a 6-digit number'),
  }),
};

export const setupOtp = {
  body: Joi.object().keys({
    // No additional parameters needed, user details are derived from authenticated user
  }),
};

export const sendOtp = {
  body: Joi.object().keys({
    // No additional parameters needed, user details are derived from authenticated user
  }),
};
