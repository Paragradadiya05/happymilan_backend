import Joi from 'joi';
import enumFields, { EnumAppUsesTypeOfUsers } from 'models/enum.model';
import config from '../../config/config';

export const register = {
  body: Joi.object()
    .keys({
      email: Joi.string().email().optional(), // Optional, but should be a valid email if provided
      password: Joi.string(),
      name: Joi.string().required(), // Name is required
      mobileNumber: Joi.string()
        .pattern(/^[0-9]{10,15}$/)
        .optional(), // Optional, but should be valid if provided (between 10-15 digits)
      userUniqueId: Joi.string().optional(), // Optional field
      countryCodeId: Joi.objectId().required(),
    })
    .xor('email', 'mobileNumber'),
};

export const login = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
    deviceToken: Joi.string().allow(''),
  }),
};

export const me = {
  query: Joi.object().keys({
    appUsesType: Joi.string()
      .valid(...Object.values(EnumAppUsesTypeOfUsers))
      .optional(),
  }),
};

export const verifyEmail = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

export const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

export const verifyOtp = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    otp: Joi.number().required(),
    deviceToken: Joi.string().allow(''),
  }),
};

// Token-based Verification when user select forgotPassword
export const verifyCode = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    code: Joi.string().length(config.jwt.resetPasswordCodeSize).required(),
  }),
};

export const addTokensToUser = {
  body: Joi.object().keys({
    accessToken: Joi.string().required(),
    refreshToken: Joi.string().required(),
  }),
};

export const resetPassword = {
  body: Joi.object().keys({
    password: Joi.string().required(),
    email: Joi.string().email().required(),
    code: Joi.string().required(),
  }),
};

export const resetPasswordOtp = {
  body: Joi.object().keys({
    password: Joi.string(),
    email: Joi.string().email().required(),
    newMail: Joi.string().email(),
    mobileNumber: Joi.number(),
    otp: Joi.number().required(),
  }),
};

export const resetPasswordOtpVerify = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    otp: Joi.number().required(),
  }),
};

// Token-based resetPassword validation
export const resetPasswordToken = {
  body: Joi.object().keys({
    password: Joi.string().required(),
    email: Joi.string().email().required(),
    code: Joi.string().length(config.jwt.resetPasswordCodeSize).required(),
  }),
};

export const changePassword = {
  body: Joi.object().keys({
    password: Joi.string().required(),
  }),
};

export const sendVerifyEmail = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

export const updateEmailAndMobile = {
  body: Joi.object().keys({
    email: Joi.object().keys({
      currentEmail: Joi.string().email().required(),
      newEmail: Joi.string().email().required(),
    }),
    mobileNumber: Joi.object().keys({
      currentMobileNumber: Joi.number().required(),
      newMobileNumber: Joi.number().required(),
    }),
  }),
};
export const verifyEmailAndMobile = {
  body: Joi.object().keys({
    email: Joi.object().keys({
      currentEmail: Joi.string().email().required(),
      newEmail: Joi.string().email().required(),
      otp: Joi.number().required(),
    }),
    mobileNumber: Joi.object().keys({
      currentMobileNumber: Joi.number().required(),
      newMobileNumber: Joi.number().required(),
      otp: Joi.number().required(),
    }),
  }),
};

export const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

export const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
    deviceToken: Joi.string(),
  }),
};

export const googleLogin = {
  body: Joi.object().keys({
    access_token: Joi.string().required(),
  }),
};

export const faceBookLogin = {
  body: Joi.object().keys({
    access_token: Joi.string().required(),
  }),
};

export const appleLogin = {
  body: Joi.object().keys({
    access_token: Joi.string().required(),
  }),
};

export const githubLogin = {
  body: Joi.object().keys({
    access_token: Joi.string().required(),
  }),
};

export const createDeviceToken = {
  body: Joi.object().keys({
    deviceToken: Joi.string(),
    platform: Joi.string().valid(...Object.values(enumFields.EnumPlatformOfDeviceToken)),
  }),
};

export const updateDeviceToken = {
  body: Joi.object().keys({
    deviceToken: Joi.string().required(),
  }),
};

export const updatepss = {
  body: Joi.object().keys({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
  }),
};

export const triggerLoginValidation = {
  body: Joi.object().keys({
    channel: Joi.string().required(),
    token: Joi.string().required(),
  }),
};
