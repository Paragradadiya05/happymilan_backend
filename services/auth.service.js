import httpStatus from 'http-status';
import ApiError from 'utils/ApiError';
import _ from 'lodash';
import { User, Token, Notification } from 'models';
import { userService, tokenService, emailService } from 'services';
import { EnumTypeOfToken, EnumCodeTypeOfCode, EnumOfNotification } from 'models/enum.model';
import bcrypt from 'bcryptjs';
import { generateOtp } from 'utils/common';
import { sendNotification } from './notification.service';
/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
export const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Incorrect email or password');
  }
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Incorrect email or password');
  }
  if (!user.emailVerified) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Please check your email and verify it to continue login in to app');
  }
  return user;
};

export const verifyEmail = async (verifyRequest) => {
  const { token } = verifyRequest;
  const verifyEmailTokenDoc = await tokenService.verifyToken(token, EnumTypeOfToken.VERIFY_EMAIL);
  const { user } = verifyEmailTokenDoc;
  await Token.deleteMany({ user, type: EnumTypeOfToken.VERIFY_EMAIL });
  const filter = {
    _id: user,
  };
  return userService.updateUser(filter, { emailVerified: true });
};

/**
 * forgotPassword with Email
 * @param {string} email
 * @returns {Promise<User>}
 */
export const forgotPassword = async (email) => {
  const user = await userService.getOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'no user found with this email');
  }
  const otp = generateOtp();
  const body = {
    $push: {
      codes: {
        code: otp,
        expirationDate: Date.now() + 10 * 60 * 1000,
        used: false,
        codeType: EnumCodeTypeOfCode.RESETPASSWORD,
      },
    },
  };

  await userService.updateUser({ email }, body, { new: true });
  await emailService.sendResetPasswordEmail(email, otp);
  const createNotificationForResetPass = await Notification.create({
    userId: user._id,
    body: EnumOfNotification.RESET_PASS,
  });
  console.log('=====xx====>', createNotificationForResetPass);
  // send notification
  // check if usr hase deice token or not
  console.log('===== Otp deviceTokens ====>', user);
  console.log('=== var Otp deviceTokens.length ===>', user.deviceTokens.length);
  if (user.deviceTokens.length) {
    const deviceToken = user.deviceTokens.map((fcmToken) => fcmToken.deviceToken);
    console.log('=== var Otp deviceToken name ===>', deviceToken);
    await sendNotification(
      deviceToken,
      {
        data: {
          _id: createNotificationForResetPass._id.toString(),
          userId: createNotificationForResetPass.userId.toString(),
          body: EnumOfNotification.RESET_PASS,
          createdAt: createNotificationForResetPass.createdAt.toString(),
          updatedAt: createNotificationForResetPass.updatedAt.toString(),
        },
      },
      {}
    );
  }
  return user;
};

export const resetPasswordOtp = async (resetPasswordRequest) => {
  const { email, otp, password, newMail, mobileNumber } = resetPasswordRequest;
  const existingUserWithNewMail = await userService.getOne({ email: newMail });
  const existingUserWithMobile = mobileNumber ? await userService.getOne({ mobileNumber }) : null;
  if (existingUserWithNewMail) {
    throw new Error('New email is already associated with another user.');
  }
  if (existingUserWithMobile) {
    throw new Error('Mobile number is already associated with another user.');
  }
  if (!mobileNumber && !password && !newMail) {
    throw new Error('At least one of mobileNumber, password, or newMail is required.');
  }
  const providedFields = [mobileNumber, password, newMail].filter((field) => field !== undefined);
  if (providedFields.length !== 1) {
    throw new Error('Exactly one of mobileNumber, password, or newMail is required.');
  }
  const user = await tokenService.verifyResetOtp(email, otp);
  const filter = {
    _id: user._id,
  };
  return userService.updateUser(filter, {
    ...(password && { password }),
    ...(newMail && { email: newMail }),
    ...(mobileNumber && { mobileNumber }),
  });
};

/**
 * Reset password Token-based Service
 * @returns {Promise}
 * @param resetPasswordRequest
 * @param {string} [resetPasswordRequest.password]
 * @param {string} [resetPasswordRequest.code]
 * @param {string} [resetPasswordRequest.email]
 */
export const resetPasswordToken = async (resetPasswordRequest) => {
  const { email, code, password } = resetPasswordRequest;
  const resetPasswordTokenDoc = await tokenService.verifyCode({
    email,
    type: EnumTypeOfToken.RESET_PASSWORD,
    code,
  });
  const { user } = resetPasswordTokenDoc;
  await Token.deleteMany({ user, type: EnumTypeOfToken.RESET_PASSWORD });
  const filter = {
    _id: user._id,
  };
  return userService.updateUser(filter, { password });
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
export const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, EnumTypeOfToken.REFRESH);
    const user = await userService.getUserById(refreshTokenDoc.user);
    if (!user) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid Token');
    }
    await refreshTokenDoc.remove();
    return tokenService.generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

/**
 * check whether user is being created from the method createSocialUser if not then throw the Error
 * @param user
 * @returns {Promise<*>}
 */
export const socialLogin = async (user) => {
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid SingIn');
  }
  return user;
};

/**
 * Create the Social user like Facebook, google and Apple Login
 * @param accessToken
 * @param refreshToken
 * @param profile
 * @param provider
 * @returns {Promise<*>}
 */
export const createSocialUser = async (accessToken, refreshToken, profile, provider) => {
  const query = {};
  const userObj = {};
  /**
   * If provider is facebook then save the details of user in db.
   */
  if (provider === 'facebook') {
    query.$or = [{ 'facebookProvider.id': profile.id }, { email: profile.emails[0].value }];
    const userFullName = profile.displayName.split(' ');
    const [firstName, lastName] = userFullName;
    userObj.name = firstName;
    userObj.lastName = lastName || '';
    userObj.email = profile.emails[0].value;
    userObj.facebookProvider = {
      id: profile.id,
      token: accessToken,
    };
    userObj.emailVerified = true;
  }
  /**
   * If provider is google then save the details of user in db.
   */
  if (provider === 'google') {
    query.$or = [{ 'googleProvider.id': profile.id }, { email: profile.emails[0].value }];
    const userFullName = profile.displayName.split(' ');
    const [firstName, lastName] = userFullName;
    userObj.name = firstName;
    userObj.lastName = lastName || '';
    userObj.email = profile.emails[0].value;
    userObj.googleProvider = {
      id: profile.id,
      token: accessToken,
    };
    userObj.emailVerified = true;
  }
  /**
   * If provider is github then save the details of user in db.
   */
  if (provider === 'github') {
    if (_.isEmpty(profile.emails[0].value)) {
      throw new ApiError(
        'Your gitHub email is private please make it public if you want to login with gitHub!',
        httpStatus.BAD_REQUEST
      );
    }
    query.$or = [{ 'githubProvider.id': profile.id }, { email: profile.emails[0].value }];
    // here if user has name and email in displayName and json then first it checks for that
    // otherwise it takes value as default value as we give.
    const userFullName = profile.displayName ? profile.displayName.split(' ') : [];
    const [firstName, lastName] = userFullName;
    userObj.name = firstName || profile.username;
    userObj.lastName = lastName || '';
    userObj.email = profile._json.email ? profile._json.email : profile.emails[0].value;
    userObj.active = true;
    userObj.githubProvider = {
      id: profile.id,
      token: accessToken,
    };
    userObj.emailVerified = true;
  }
  /**
   * If provider is apple then save the details of user in db.
   */
  if (provider === 'apple') {
    if (_.isEmpty(profile.emails[0].value)) {
      throw new ApiError(
        'Your apple account email is private please make it public if you want to login with apple!',
        httpStatus.BAD_REQUEST
      );
    }
    query.$or = [{ 'appleProvider.id': profile.sub }, { email: profile.email }];
    userObj.name = profile.email.split('@')[0] || '';
    userObj.email = profile.email;
    userObj.appleProvider = {
      id: profile.sub,
      token: accessToken,
    };
    userObj.emailVerified = true;
  }
  userObj.password = Math.random().toString(36).slice(-10);
  return User.findOne(query).then(async (user) => {
    if (!user) {
      const newUser = new User(userObj);
      return newUser.save();
    }
    if (provider === 'facebook') {
      user.facebookProvider = userObj.facebookProvider; // eslint-disable-line no-param-reassign
    }
    if (provider === 'google') {
      user.googleProvider = userObj.googleProvider; // eslint-disable-line no-param-reassign
    }
    if (provider === 'github') {
      // eslint-disable-next-line no-param-reassign
      user.githubProvider = userObj.githubProvider;
    }
    if (provider === 'apple') {
      user.appleProvider = userObj.appleProvider; // eslint-disable-line no-param-reassign
    }
    return User.findOneAndUpdate({ _id: user._id }, user, {
      new: true,
      upsert: true,
    });
  });
};
