import httpStatus from 'http-status';
import { generateOtp, generateRandomId } from 'utils/common';
import ApiError from 'utils/ApiError';
import { catchAsync } from 'utils/catchAsync';
import { authService, tokenService, userService, emailService, countryCodeService, twoFactorAuthService } from 'services';
import { EnumTypeOfToken, EnumCodeTypeOfCode, EnumOfNotification, EnumOf2faMethod } from 'models/enum.model';
import { resendOtpToMobile, sendOtpToMobile } from '../../services/mobileotp.service';
import { Notification } from '../../models';
import { sendNotification } from '../../services/notification.service';
import { generateAndSendOtp } from '../../services/twoFactorAuth.service';
import { checkUserPremiumStatus } from '../../services/friend.service';

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

  const checkUserActivePlan = await checkUserPremiumStatus(user._id);
  // console.log('=====xx====>', checkUserActivePlan);

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
  const tokens = await tokenService.generateAuthTokens(user, checkUserActivePlan);
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

  let updatedUser = user;

  if (deviceToken) {
    updatedUser = await userService.addDeviceToken(user, req.body);
  }

  // Send congratulation email
  await emailService.sendCongratulationEmail(user);

  // Create notification in DB
  const createNotificationForCongratulation = await Notification.create({
    userId: updatedUser._id,
    body: EnumOfNotification.CONGRATULATION,
  });

  // Send push notification if user has device tokens
  if (updatedUser.deviceTokens && updatedUser.deviceTokens.length) {
    const deviceTokens = updatedUser.deviceTokens.map((fcmToken) => fcmToken.deviceToken);

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

  return res.status(httpStatus.OK).send({ results: { user: updatedUser, tokens } });
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
  const { user } = req;
  const { email, mobileNumber, countryCodeId, ...otherFields } = req.body;

  /* ---------------- UPDATE NORMAL FIELDS ---------------- */
  if (Object.keys(otherFields).length) {
    await userService.updateUserForAuth({ _id: user._id }, otherFields, { new: true }, user);
  }

  /* ---------------- EMAIL UPDATE ---------------- */
  if (email && email !== user.email) {
    // Check email already exists
    const existingEmail = await userService.getOne({
      email,
      _id: { $ne: user._id },
    });

    if (existingEmail) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }

    // Generate OTP
    const otp = generateOtp();

    // Save OTP
    user.codes.push({
      code: String(otp),
      codeType: EnumCodeTypeOfCode.EMAIL,
      expirationDate: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      used: false,
    });

    // Save pending email
    user.pendingEmail = email;

    await user.save();

    // Send OTP Email
    await emailService.sendOtpVerificationEmail({ email }, otp);

    return res.status(httpStatus.OK).send({
      message: 'OTP sent to email. Please verify.',
      verifyType: 'email',
    });
  }

  /* ---------------- MOBILE UPDATE ---------------- */
  if (mobileNumber && mobileNumber !== user.mobileNumber) {
    if (!countryCodeId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'countryCodeId is required');
    }

    // Check mobile already exists
    const existingMobile = await userService.getOne({
      mobileNumber,
      _id: { $ne: user._id },
    });

    if (existingMobile) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Mobile number already taken');
    }

    // Get country code
    const country = await countryCodeService.getCountryCodeById(countryCodeId);

    if (!country) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Valid countryCodeId required');
    }

    // Generate OTP
    const otp = generateOtp();

    // Save OTP
    user.codes.push({
      code: String(otp),
      codeType: EnumCodeTypeOfCode.MOBILE,
      expirationDate: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      used: false,
    });

    // Save pending mobile
    user.pendingMobileNumber = mobileNumber;
    user.pendingCountryCode = country.code;

    await user.save();

    // Send OTP
    await sendOtpToMobile(`${country.code}${mobileNumber}`, otp);

    return res.status(httpStatus.OK).send({
      message: 'OTP sent to mobile number. Please verify.',
      verifyType: 'mobile',
    });
  }

  /* ---------------- FINAL RESPONSE ---------------- */
  return res.status(httpStatus.OK).send({
    message: 'Profile updated successfully',
  });
});

export const sendVerifyOtp = catchAsync(async (req, res) => {
  const { email, mobileNumber, countryCodeId } = req.body;
  // Ensure email or mobileNumber is provided in the request
  if (!email && !mobileNumber) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email or mobile number is required.');
  }
  // Fetch the user based on email or mobileNumber from the body
  const searchCondition = email
    ? { email: { $regex: `^${email}$`, $options: 'i' } } // Case-insensitive exact match
    : { mobileNumber };

  // Fetch user
  const user = await userService.getOne(searchCondition);
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
  if (mobileNumber) {
    const userCountryCode = await countryCodeService.getCountryCodeById(countryCodeId);
    if (!userCountryCode) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Please provide countryCode while using registration with Mobile number.');
    }

    try {
      await resendOtpToMobile(`${userCountryCode.code}${user.mobileNumber}`, otp);
      console.log('OTP resent to mobile');
      return res.status(httpStatus.OK).send({
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
  } else if (email) {
    // Handle email-based OTP
    try {
      await emailService.sendOtpVerificationEmail(user, otp);
      console.log('OTP sent to email');
      return res.status(httpStatus.OK).send({
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
  const tokens = await tokenService.generateAuthTokens(req.user);
  res.status(httpStatus.OK).send({ results: { user, tokens } });
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
  if (mobileNumber && mobileNumber.currentMobileNumber !== user.mobileNumber) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'your current mobile number is wrong. please add right current number');
  }
  if (mobileNumber && mobileNumber.newMobileNumber === user.mobileNumber) {
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
  res.status(httpStatus.OK).send({ results: { success: true, message: 'reset successfully' } });
});
