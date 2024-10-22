import jwt from 'jsonwebtoken';
import moment from 'moment';
import httpStatus from 'http-status';
import { Token } from 'models';
import ApiError from 'utils/ApiError';
import config from 'config/config';
import _ from 'lodash';
import { userService, storyService } from 'services';
import { EnumTypeOfToken, EnumCodeTypeOfCode } from 'models/enum.model';
/**
 * Generate token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} [secret]
 * @returns {string}
 */
export const generateToken = (userId, expires, storyId = null, secret = config.jwt.secret) => {
  const payload = {
    ...(storyId && { storyId }),
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
  };
  return jwt.sign(payload, secret);
};

/**
 * Save a token
 * @param {string} token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
export const saveToken = async (token, userId, expires, storyId, type, blacklisted = false) => {
  const tokenDoc = await Token.create({
    token,
    user: userId,
    expires: expires.toDate(),
    type,
    blacklisted,
    ...(storyId && { storyId }),
  });
  return tokenDoc;
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
export const verifyToken = async (token, type) => {
  const secretOrPublicKey = config.jwt.secret;
  const payload = jwt.verify(token, secretOrPublicKey, { ignoreExpiration: true });
  const tokenDoc = await Token.findOne({ token, type, user: payload.sub });
  if (!tokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Invalid Token');
  }
  return tokenDoc;
};

/**
 * Verify Code
 * @returns {Promise<Token>}
 * @param verificationRequest
 * @param {string} [verificationRequest.token]
 * @param {string} [verificationRequest.type]
 * @param {string} [verificationRequest.user]
 */
export const verifyCode = async (verificationRequest) => {
  const { code: token, type, email } = verificationRequest;
  const userObj = await userService.getOne({ email });
  if (!userObj) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No such User');
  }
  const tokenDoc = await Token.findOne({ token, type, user: userObj._id });
  if (!tokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Incorrect code');
  }
  return tokenDoc;
};

export const verifyOtp = async (email, otp) => {
  const user = await userService.getOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'no user found with this email');
  }
  if (user.emailVerified) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'your email is already verified!');
  }
  // eslint-disable-next-line eqeqeq
  const otpCode = _.find(user.codes, (code) => code.code == otp && code.codeType === EnumCodeTypeOfCode.LOGIN);
  if (!otpCode || otpCode.expirationDate < Date.now()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'otp is Invalid');
  }
  user.codes = _.filter(user.codes, (code) => code.code !== otp);
  user.emailVerified = true;
  user.active = true;
  return user.save();
};

/**
 * Generate token
 * @returns {string}
 * @param length
 */
const generateCode = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * charactersLength))).join('');
};
/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
export const generateResetPasswordToken = async (email) => {
  const user = await userService.getOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
  }
  const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
  const resetPasswordToken = generateCode(config.jwt.resetPasswordCodeSize);
  await Token.deleteMany({ user, type: EnumTypeOfToken.RESET_PASSWORD });
  await saveToken(resetPasswordToken, user.id, expires, EnumTypeOfToken.RESET_PASSWORD);
  return resetPasswordToken;
};

export const verifyResetOtp = async (email, otp) => {
  const user = await userService.getOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'no user found with this email');
  }

  // Find the OTP code in the user's codes array
  const otpCodeIndex = _.findIndex(
    user.codes,
    (code) => code.code === otp.toString() && code.codeType === EnumCodeTypeOfCode.RESETPASSWORD
  );
  if (otpCodeIndex === -1 || user.codes[otpCodeIndex].expirationDate < Date.now()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'OTP is invalid');
  }
  // Update the user document // todo : check if update user needed ot not.
  await userService.updateUser({ email }, { $set: { codes: user.codes } });
  // await user.save();
  return user;
};

export const verifyResetOtpForChangeEmailOrNumber = async (user, otp) => {
  // Find the OTP code in the user's codes array
  const otpCodeIndex = _.findIndex(
    user.codes,
    (code) => code.code === otp.toString() && code.codeType === EnumCodeTypeOfCode.RESET_LOGIN_CRED
  );
  if (otpCodeIndex === -1 || user.codes[otpCodeIndex].expirationDate < Date.now()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'OTP is invalid');
  }
  // Update the user document // todo : check if update user needed ot not.
  return user;
};

export const verifyResetOtpVerify = async (email, otp) => {
  const user = await userService.getOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'no user found with this email');
  }
  // eslint-disable-next-line eqeqeq
  const otpCode = _.find(user.codes, (code) => code.code == otp && code.codeType === EnumCodeTypeOfCode.RESETPASSWORD);
  if (!otpCode) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'otp is Invalid');
  }
  if (otpCode.expirationDate < Date.now()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'otp is expired');
  }
  return user;
};

/**
 * Generate Verify email token
 * @param {string} email
 * @returns {Promise<string>}
 */
export const generateVerifyEmailToken = async (email) => {
  const user = await userService.getOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
  } else if (user.emailVerified) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email is already Verified');
  }
  const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
  const token = generateToken(user.id, expires);
  await Token.deleteMany({ user, type: EnumTypeOfToken.VERIFY_EMAIL });
  await saveToken(token, user.id, expires, EnumTypeOfToken.VERIFY_EMAIL);
  return token;
};

/**
 * Generate Verify email token
 * @param {string} storyId
 * @returns {Promise<string>}
 */
export const generateVerifyStoryConsentToken = async (userId, storyId) => {
  const user = await userService.getUserById(userId);
  const getStory = await storyService.getStoryById(storyId);
  if (!getStory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No story found with this id');
  } else if (getStory.isConsentTaken) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'story is already Verified');
  }
  const expires = moment().add(config.story.storyExpirationMinutes, 'minutes');
  const token = generateToken(user.id, expires);
  await Token.deleteMany({ storyId, type: EnumTypeOfToken.STORY_CONSENT });
  await saveToken(token, user.id, expires, storyId, EnumTypeOfToken.STORY_CONSENT);
  return token;
};

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<Object>}
 */
export const generateAuthTokens = async (user) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.id, accessTokenExpires);
  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user.id, refreshTokenExpires);
  await saveToken(refreshToken, user.id, refreshTokenExpires, EnumTypeOfToken.REFRESH);
  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

/**
 * Get auth tokens
 * @param {User} user
 * @param token
 * @returns {Promise<Object>}
 */
export const getAuthTokens = async (user, token) => {
  const tokenDoc = await Token.findOne({ type: EnumTypeOfToken.REFRESH, user: user.id });
  if (!tokenDoc) {
    throw new Error('Token not found');
  }
  const { exp } = jwt.verify(token, config.jwt.secret);
  return {
    access: {
      token,
      expires: moment.unix(exp).toDate(),
    },
    refresh: {
      token: tokenDoc.token,
      expires: tokenDoc.expires,
    },
  };
};

/**
 * @returns {Promise<*>}
 * @param {Object}  invalidReq
 */
export const invalidateToken = async (invalidReq) => {
  const { refreshToken: token } = invalidReq;
  const tokenDoc = await Token.findOne({ type: EnumTypeOfToken.REFRESH, token });
  if (!tokenDoc) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Token not found');
  } else {
    return Token.findByIdAndDelete(tokenDoc._id);
  }
};
