import Joi from 'joi';

export const verifyTwoFactorAuth = {
  body: Joi.object().keys({
    token: Joi.string()
      .pattern(/^\d{4}$|^\d{6}$/) // Ensures 4 or 6 digit numeric values only
      .messages({ 'string.pattern.base': 'Two-factor code must be either 4 or 6 digits' }),
  }),
};

export const setupOtp = {
  body: Joi.object().keys({
    otpType: Joi.string().valid('email', 'mobile').required(),
  }),
};

export const sendOtp = {
  body: Joi.object().keys({
    // No additional parameters needed, user details are derived from authenticated user
  }),
};

export const sendOtpPublic = {
  body: Joi.object()
    .keys({
      email: Joi.string().email().optional(),
      mobileNumber: Joi.string()
        .pattern(/^[0-9]{7,15}$/)
        .optional(),
    })
    .or('email', 'mobileNumber') // At least one is required
    .messages({
      'object.missing': 'Either email or mobileNumber is required',
    }),
};
