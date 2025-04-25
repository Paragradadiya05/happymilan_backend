import httpStatus from 'http-status';
import { generateOtp, generateRandomId } from 'utils/common';
import ApiError from 'utils/ApiError';
import { catchAsync } from 'utils/catchAsync';
import { authService, tokenService, userService, emailService, countryCodeService, twoFactorAuthService } from 'services';
import {
  EnumTypeOfToken,
  EnumCodeTypeOfCode,
  EnumForTimeDurationOfProfileHide,
  EnumOfNotification,
  EnumOf2faMethod,
} from 'models/enum.model';
import { resendOtpToMobile, sendOtpToMobile } from '../../services/mobileotp.service';
import { Notification } from '../../models';
import { sendNotification } from '../../services/notification.service';
import { generateAndSendOtp } from '../../services/twoFactorAuth.service';

export const register = catchAsync(async (req, res) => {
  const { body } = req;
  const userUniqueId = generateRandomId();

  let userCountryCode = null;

  // Check for mobile number and fetch country code only if mobile number is present
  if (body.mobileNumber) {
    userCountryCode = await countryCodeService.getCountryCodeById(body.countryCodeId);
    if (!userCountryCode) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Please provide a valid countryCode while using registration with a mobile number.'
      );
    }
  }

  // Create the user object, only add countryCode if the user registered with a mobile number
  const user = await userService.createUser({
    ...body,
    userUniqueId,
    ...(userCountryCode && { countryCode: userCountryCode.code }), // Only include countryCode if it's present
  });

  const otp = generateOtp();
  user.codes.push({
    code: otp,
    expirationDate: Date.now() + 10 * 60 * 1000, // OTP valid for 10 minutes
    used: false,
    codeType: EnumCodeTypeOfCode.LOGIN,
  });
  await user.save();

  // Privacy policy questions setup
  // const questions = [
  //   {
  //     userId: user._id,
  //     question: 'Who can see your mobile number?',
  //     options: [
  //       { option: 'Visible to all', isSelected: false },
  //       { option: 'Only visible to registered Members', isSelected: false },
  //     ],
  //   },
  //   {
  //     userId: user._id,
  //     question: 'Who can see your email address?',
  //     options: [
  //       { option: 'Visible to all', isSelected: false },
  //       { option: 'Only visible to registered Members', isSelected: false },
  //     ],
  //   },
  //   {
  //     userId: user._id,
  //     question: 'Profile privacy',
  //     options: [
  //       { option: 'Visible to all, including unregistered visitors', isSelected: false },
  //       { option: 'Only visible to registered Members', isSelected: false },
  //     ],
  //   },
  // ];

  // todo :  not needed as we not need any more based on new changes in design remove all things to this one
  // await pravicyservice.createPrivacy(questions);

  // Send OTP based on mobile or email
  if (user.mobileNumber) {
    // Send OTP to mobile via MSG91 API
    try {
      await sendOtpToMobile(`${user.countryCode}${user.mobileNumber}`, otp); // Call your function to send OTP via MSG91
      console.log('OTP sent to mobile via MSG91');
    } catch (error) {
      console.error('Error sending OTP to mobile:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
        message: 'Error sending OTP to mobile',
      });
    }
  } else if (user.email) {
    // Send OTP to email
    try {
      await emailService.sendOtpVerificationEmail(user, otp);
      console.log('OTP sent to email');
    } catch (error) {
      console.error('Error sending OTP to email:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
        message: 'Error sending OTP to email',
      });
    }
  }

  // Create notification for OTP
  const createNotificationForOtp = await Notification.create({
    userId: user._id,
    body: EnumOfNotification.OTP_SEND,
  });

  // console.log('Notification created for OTP:', createNotificationForOtp);

  // Send notification if device tokens are present
  if (user && user.deviceTokens && user.deviceTokens.length) {
    const deviceToken = user.deviceTokens.map((fcmToken) => fcmToken.deviceToken);
    await sendNotification(
      deviceToken,
      {
        data: {
          _id: createNotificationForOtp._id.toString(),
          userId: createNotificationForOtp.userId.toString(),
          body: EnumOfNotification.OTP_SEND,
          createdAt: createNotificationForOtp.createdAt.toString(),
          updatedAt: createNotificationForOtp.updatedAt.toString(),
        },
      },
      {}
    );
  }

  res.status(httpStatus.OK).send({
    results: {
      success: true,
      message: 'OTP has been sent to your registered mobile or email. Please verify.',
    },
  });
});
const maskEmail = (email) => {
  if (!email) return null;
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 3) {
    return `${localPart[0]}***@${domain}`;
  }
  return `${localPart.slice(0, 3)}***${localPart.slice(-3)}@${domain}`;
};
const maskMobileNumber = (mobileNumber) => {
  if (!mobileNumber) return null;
  const mobileStr = String(mobileNumber); // Convert to string
  if (mobileStr.length < 4) return null;
  return `${mobileStr.slice(0, 3)}******${mobileStr.slice(-2)}`;
};
export const login = catchAsync(async (req, res) => {
  const { email, password, mobileNumber, countryCodeId, twoFactorCode, deviceToken } = req.body;

  // First, authenticate the user with email/password or mobile/password
  const user = await authService.loginUserWithEmailOrMobileAndPassword(email, mobileNumber, countryCodeId, password);

  // Check if 2FA is enabled for this user
  if (user.twoFactorAuth && user.twoFactorAuth.isEnabled) {
    // If 2FA is enabled but no code provided, return a response indicating 2FA is required
    if (!twoFactorCode) {
      if (user.twoFactorAuth.method === EnumOf2faMethod.OTP) {
        await generateAndSendOtp(user);
        return res.status(httpStatus.BAD_REQUEST).send({
          requireTwoFactor: true,
          method: user.twoFactorAuth.method,
          message: 'Two-factor authentication code required',
          userId: user.id,
          email: maskEmail(user.email),
          mobileNumber: maskMobileNumber(user.mobileNumber),
          otpType: user.twoFactorAuth.otpType,
        });
      }
      return res.status(httpStatus.BAD_REQUEST).send({
        requireTwoFactor: true,
        method: user.twoFactorAuth.method,
        message: 'Two-factor authentication code required',
        userId: user.id,
      });
    }

    // Verify the 2FA code based on method
    const isValid = await twoFactorAuthService.verifyToken(user, twoFactorCode);
    if (!isValid) {
      return res.status(httpStatus.UNAUTHORIZED).send({
        requireTwoFactor: true,
        method: user.twoFactorAuth.method,
        message: 'Invalid two-factor authentication code',
      });
    }
  }

  // If 2FA is not enabled or code is valid, proceed with login
  const tokens = await tokenService.generateAuthTokens(user);
  if (deviceToken) {
    const updatedUser = await userService.addDeviceToken(user, req.body);
    res.status(httpStatus.OK).send({ results: { user: updatedUser, tokens } });
  } else {
    res.status(httpStatus.OK).send({ results: { user, tokens } });
  }
});

// if user's email is not verified then we call this function for reverification
export const sendVerifyEmail = catchAsync(async (req, res) => {
  const { email } = req.body;
  const emailVerifyToken = await tokenService.generateVerifyEmailToken(email);
  const user = await userService.getOne({ email });
  emailService.sendEmailVerificationEmail(user, emailVerifyToken).then().catch();
  res.status(httpStatus.OK).send({
    success: true,
    message: 'Email has been sent to your registered email. Please check your email and verify it',
  });
});

/**
 * Token-based forgotPassword Verify Controller
 * @type {(request.query: token)}
 * @return (successMessage)
 */
export const verifyEmail = catchAsync(async (req, res) => {
  try {
    await authService.verifyEmail(req.query);
    res.status(httpStatus.OK).send({ message: 'Your Email is Verified Successfully' });
  } catch (e) {
    console.log('===e===', e);
    res.status(httpStatus.OK).send({ message: e.message });
  }
});

export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword(email);
  res.status(httpStatus.OK).send({ results: { success: true, message: 'Code has been sent' } });
});

/**
 * Token-based forgotPassword Controller
 * @type {(function(*, *, *): void)|*}
 */
export const forgotPasswordToken = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.OK).send({ success: true, message: 'Code has been sent' });
});

/**
 * Token-based forgotPassword Verify Controller
 * @type {(function(*, *, *): void)|*}
 */
export const verifyResetCode = catchAsync(async (req, res) => {
  req.body.type = EnumTypeOfToken.RESET_PASSWORD;
  await tokenService.verifyCode(req.body);
  res.status(httpStatus.OK).send({ success: true });
});

export const verifyOtp = catchAsync(async (req, res) => {
  const { otp, email, mobileNumber, deviceToken } = req.body;

  // Pass both to allow fallback
  await tokenService.verifyOtp({ email, mobileNumber, otp });

  const user = await userService.getOne(email ? { email } : { mobileNumber });

  const tokens = await tokenService.generateAuthTokens(user);

  if (deviceToken) {
    const updatedUser = await userService.addDeviceToken(user, req.body);
    return res.status(httpStatus.OK).send({ results: { user: updatedUser, tokens } });
  }

  await emailService.sendCongratulationEmail(user).catch(); // Optional email sending
  const createNotificationForCongratulation = await Notification.create({
    userId: user._id,
    body: EnumOfNotification.CONGRATULATION,
  });

  if (user.deviceTokens && user.deviceTokens.length) {
    const deviceTokens = user.deviceTokens.map((fcmToken) => fcmToken.deviceToken);
    await sendNotification(
      deviceTokens,
      {
        data: {
          _id: createNotificationForCongratulation._id.toString(),
          userId: createNotificationForCongratulation.userId.toString(),
          body: EnumOfNotification.CONGRATULATION,
          createdAt: createNotificationForCongratulation.createdAt.toString(),
          updatedAt: createNotificationForCongratulation.updatedAt.toString(),
        },
      },
      {}
    );
  }

  res.status(httpStatus.OK).send({ results: { user, tokens } });
});

export const resetPasswordOtp = catchAsync(async (req, res) => {
  await authService.resetPasswordOtp(req.body);
  res.status(httpStatus.OK).send({ results: { success: true, message: 'Data has been reset successfully' } });
});

export const resetPasswordOtpVerify = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const user = await tokenService.verifyResetOtpVerify(email, otp);
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'something is went wrong!');
  }
  res.status(httpStatus.OK).send({ results: { success: true } });
});

/**
 * Token-based resetPassword Controller
 * @type {(function(*, *, *): void)|*}
 */
export const resetPasswordToken = catchAsync(async (req, res) => {
  await authService.resetPasswordToken(req.body);
  res.status(httpStatus.OK).send({ success: true, message: 'Password has been reset successfully' });
});

export const userInfo = catchAsync(async (req, res) => {
  const options = {};
  const user = await userService.getUserById(req.user._id, options);
  res.status(httpStatus.OK).send({ results: { user } });
});

/**
 * Update the userInfo when he is LoggedIn
 * @type {(function(*, *, *): void)|*}
 */
export const updateUserInfo = catchAsync(async (req, res) => {
  const filter = { _id: req.user._id };
  const { body } = req;

  if (body.profileHideAndDelete) {
    if (body.profileHideAndDelete.isProfileHide && !body.profileHideAndDelete.timeForProfileHide) {
      const sixMonthsLater = new Date();
      body.profileHideAndDelete.timeForProfileHide = sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    } else if (body.profileHideAndDelete.isProfileHide && body.profileHideAndDelete.timeForProfileHide) {
      if (body.profileHideAndDelete.timeForProfileHide === EnumForTimeDurationOfProfileHide.ONE_MONTH) {
        const oneMonthsLater = new Date();
        body.profileHideAndDelete.timeForProfileHide = oneMonthsLater.setMonth(oneMonthsLater.getMonth() + 1);
      }
      if (body.profileHideAndDelete.timeForProfileHide === EnumForTimeDurationOfProfileHide.THREE_MONTH) {
        const threeMonthsLater = new Date();
        body.profileHideAndDelete.timeForProfileHide = threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
      }
      if (body.profileHideAndDelete.timeForProfileHide === EnumForTimeDurationOfProfileHide.SIX_MONTH) {
        const sixMonthsLater = new Date();
        body.profileHideAndDelete.timeForProfileHide = sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
      }
      if (body.profileHideAndDelete.timeForProfileHide === EnumForTimeDurationOfProfileHide.ONE_WEEK) {
        const oneWeekLater = new Date();
        body.profileHideAndDelete.timeForProfileHide = oneWeekLater.setDate(oneWeekLater.getDate() + 7);
      }
      if (body.profileHideAndDelete.timeForProfileHide === EnumForTimeDurationOfProfileHide.TWO_WEEK) {
        const twoWeekLater = new Date();
        body.profileHideAndDelete.timeForProfileHide = twoWeekLater.setDate(twoWeekLater.getDate() + 14);
      }
    }
  }
  const userData = await userService.updateUserForAuth(
    filter,
    body,
    { returnNewDocument: true, new: true, upsert: true },
    req.user
  );
  res.status(httpStatus.OK).send({ userData });
});

export const sendVerifyOtp = catchAsync(async (req, res) => {
  const { email, mobileNumber, countryCodeId } = req.body;

  // Ensure email or mobileNumber is provided in the request
  if (!email && !mobileNumber) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email or mobile number is required.');
  }

  // Fetch the user based on email or mobileNumber from the body
  const user = await userService.getOne({
    $or: [
      { email }, // Case-insensitive search for email
      { mobileNumber }, // Mobile number search
    ],
  });

  // If user not found, throw an error
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No user found with this email or mobile number!');
  }

  // Generate OTP
  const otp = generateOtp();

  // Push the new OTP to the user's codes
  user.codes.push({
    code: otp,
    expirationDate: Date.now() + 10 * 60 * 1000, // OTP valid for 10 minutes
    used: false,
    codeType: EnumCodeTypeOfCode.LOGIN,
  });

  // Save the user document
  await user.save();

  // Handle mobile-based OTP
  if (user.mobileNumber) {
    const userCountryCode = await countryCodeService.getCountryCodeById(countryCodeId);
    if (!userCountryCode && mobileNumber) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Please provide countryCode while using registration with Mobile number.');
    }

    try {
      await resendOtpToMobile(`${userCountryCode.code}${user.mobileNumber}`, otp);
      console.log('OTP resent to mobile');
      res.status(httpStatus.OK).send({
        results: {
          success: true,
          message: 'OTP has been resent to your mobile number. Please verify.',
        },
      });
    } catch (error) {
      console.error('Error resending OTP to mobile:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
        message: 'Error resending OTP to mobile',
      });
    }
  } else if (user.email) {
    // Handle email-based OTP
    try {
      await emailService.sendOtpVerificationEmail(user, otp);
      console.log('OTP sent to email');
      res.status(httpStatus.OK).send({
        results: {
          success: true,
          message: 'OTP has been resent to your registered email. Please verify.',
        },
      });
    } catch (error) {
      console.error('Error sending OTP to email:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
        message: 'Error sending OTP to email',
      });
    }
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Either email or mobile number must be provided.');
  }
});

export const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.status(httpStatus.OK).send({ results: { ...tokens } });
});

export const logout = catchAsync(async (req, res) => {
  const { user } = req;
  const { deviceToken } = req.body;
  if (deviceToken) {
    user.deviceTokens = user.deviceTokens.filter((token) => token !== deviceToken);
    await user.save();
  }
  await tokenService.invalidateToken(req.body);
  res.status(httpStatus.OK).send({ results: { success: true } });
});

export const socialLogin = catchAsync(async (req, res) => {
  const user = await authService.socialLogin(req.user);
  const token = await tokenService.generateAuthTokens(req.user);
  res.status(httpStatus.OK).send({ results: { user, token } });
});

export const registerDeviceToken = catchAsync(async (req, res) => {
  const { user, body } = req;
  if (body.deviceToken) {
    const updatedUser = await userService.addDeviceToken(user, body);
    res.status(httpStatus.OK).send({ results: updatedUser });
  } else {
    res.status(httpStatus.OK).send({ results: user });
  }
});

export const updateDeviceToken = catchAsync(async (req, res) => {
  const { user, body } = req;
  const { deviceToken } = req.body;
  if (deviceToken) {
    const updatedUser = await userService.addDeviceToken(user, body);
    res.status(httpStatus.OK).send({ results: updatedUser });
  } else {
    res.status(httpStatus.OK).send({ results: user });
  }
});

export const updatepsss = catchAsync(async (req, res) => {
  await authService.updatepss({
    oldPassword: req.body.oldPassword,
    newPassword: req.body.newPassword,
    userId: req.user._id, // Assuming user ID is stored in req.user after authentication
  });

  res.status(httpStatus.OK).send({ results: { success: true, message: 'Password has been reset successfully' } });
});

export const generateQR = catchAsync(async (req, res) => {
  const { channel, token } = await authService.generateQR();
  return res.status(httpStatus.OK).json({
    success: true,
    msg: 'QR DATA Created',
    data: {
      channel,
      token,
    },
  });
});

export const triggerLogin = catchAsync(async (req, res) => {
  const { channel, token } = req.body;
  const authToken = req.headers.authorization;

  try {
    const response = await authService.triggerLogin(channel, token, req.user, authToken);
    return res.status(httpStatus.OK).json({
      success: true,
      msg: 'Token Triggered',
      data: {
        response,
      },
    });
  } catch (error) {
    console.error('Error triggering login:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Failed to trigger token',
    });
  }
});

export const updateEmailAndMobile = catchAsync(async (req, res) => {
  const { email, mobileNumber } = req.body;
  const { user } = req;
  if (email && email.currentEmail !== user.email) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'your current email is wrong. please add right current email');
  }
  if (email && email.newEmail === user.email) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'your new email can not be same as your old email');
  }
  if (mobileNumber && email.currentMobileNumber !== user.mobileNumber) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'your current mobile number is wrong. please add right current number');
  }
  if (mobileNumber && email.newMobileNumber === user.mobileNumber) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'your new mobile number can not be same as your old mobile number');
  }
  await authService.updateEmailAndMobile({ email, mobileNumber, user });
  res.status(httpStatus.OK).send({ results: { success: true, message: 'otp send successfully' } });
});

export const verifyEmailAndMobile = catchAsync(async (req, res) => {
  const { email, mobileNumber } = req.body;
  const { user } = req;
  // const result =
  await authService.verifyOtpForUpdatePasswordEnaEmail({ email, mobileNumber, user });
  res.status(httpStatus.OK).send({ results: { success: true, message: 'email has been reset successfully' } });
});
