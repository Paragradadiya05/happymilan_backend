import httpStatus from 'http-status';
import { generateOtp } from 'utils/common';
import ApiError from 'utils/ApiError';
import { catchAsync } from 'utils/catchAsync';
import { authService, tokenService, userService, emailService, pravicyservice } from 'services';
import {
  EnumTypeOfToken,
  EnumCodeTypeOfCode,
  EnumForTimeDurationOfProfileHide,
  EnumOfNotification,
} from 'models/enum.model';
import { Notification } from '../../models';
import { sendNotification } from '../../services/notification.service';

function generateRandomId() {
  // Current date string
  const dateString = new Date().toISOString().slice(0, 10).replace(/-/g, '').slice(4, 8);
  // Generate random characters
  const randomChars = Array.from({ length: 4 }, () => Math.random().toString(36).charAt(2)).join('');
  // Combine date string and random characters
  const uniqueId = dateString + randomChars;
  return uniqueId;
}

export const register = catchAsync(async (req, res) => {
  const { body } = req;
  const userUniqueId = generateRandomId();
  const user = await userService.createUser({ ...body, userUniqueId });
  // const emailVerifyToken = await tokenService.generateVerifyEmailToken(user.email);
  // emailService.sendEmailVerificationEmail(user, emailVerifyToken).then().catch();
  const otp = generateOtp();
  user.codes.push({
    code: otp,
    expirationDate: Date.now() + 10 * 60 * 1000,
    used: false,
    codeType: EnumCodeTypeOfCode.LOGIN,
  });
  await user.save();
  // todo : add default question for user are here

  // create privacy policy from here
  const question = [
    {
      userId: user._id,
      question: 'Who can see your mobile Number ?',
      options: [
        { option: 'Visible to all', isSelected: false },
        { option: 'Only visible to registered Members', isSelected: false },
      ],
    },
    {
      userId: user._id,
      question: 'Who can see your email address ?',
      options: [
        { option: 'Visible to all', isSelected: false },
        { option: 'Only visible to registered Members', isSelected: false },
      ],
    },
    {
      userId: user._id,
      question: 'profile privacy',
      options: [
        { option: 'Visible to all,including unregistered visitors ', isSelected: false },
        { option: 'Only visible to registered Members', isSelected: false },
      ],
    },
  ];
  question.forEach((que) => {
    que.options.forEach((opt) => {
      if (opt.isSelected) {
        console.log(`${que.question}: ${opt.option} true`);
      } else {
        console.log(`${que.question}: ${opt.option} false`);
      }
    });
  });
  await pravicyservice.createPrivacy(question);
  await emailService.sendOtpVerificationEmail(user, otp).then().catch();
  const createNotificationForOtp = await Notification.create({
    userId: user._id,
    body: EnumOfNotification.OTP_SEND,
  });
  console.log('=====xx====>', createNotificationForOtp);
  // send notification
  // check if usr hase deice token or not
  console.log('===== Otp deviceTokens ====>', user);
  console.log('=== var Otp deviceTokens.length ===>', user.deviceTokens.length);
  if (user && user.deviceTokens && user.deviceTokens.length) {
    const deviceToken = user.deviceTokens.map((fcmToken) => fcmToken.deviceToken);
    console.log('=== var Otp deviceToken name ===>', deviceToken);
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
      message: 'Email has been sent to your registered email. Please check your email and verify it',
    },
  });
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const { deviceToken } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
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
  const { body } = req;
  const { otp, email, deviceToken } = body;
  await tokenService.verifyOtp(email, otp);
  const user = await userService.getOne({ email });
  const tokens = await tokenService.generateAuthTokens(user);
  if (deviceToken) {
    const updatedUser = await userService.addDeviceToken(user, req.body);
    res.status(httpStatus.OK).send({ results: { user: updatedUser, tokens } });
  } else {
    await emailService.sendCongratulationEmail(user).then().catch();
    const createNotificationForCongratulation = await Notification.create({
      userId: user._id,
      body: EnumOfNotification.CONGRATULATION,
    });
    console.log('=====xx====>', createNotificationForCongratulation);
    // send notification
    // check if usr hase deice token or not
    console.log('===== Congratulations deviceTokens ====>', user);
    console.log('=== var Congratulations deviceTokens.length ===>', user.deviceTokens.length);
    if (user && user.deviceTokens && user.deviceTokens.length) {
      // eslint-disable-next-line no-shadow
      const deviceToken = user.deviceTokens.map((fcmToken) => fcmToken.deviceToken);
      console.log('=== var Congratulations deviceToken name ===>', deviceToken);
      await sendNotification(
        deviceToken,
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
  }
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
  const { email } = req.body;
  const otp = generateOtp();
  const user = await userService.getOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'no user found with this id!');
  }
  if (user.emailVerified) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'your email is already verified!');
  }
  user.codes.push({
    code: otp,
    expirationDate: Date.now() + 10 * 60 * 1000,
    used: false,
    codeType: EnumCodeTypeOfCode.LOGIN,
  });
  await user.save();
  await emailService.sendOtpVerificationEmail(user, otp).then().catch();
  res.status(httpStatus.OK).send({
    results: {
      success: true,
      message: 'Email has been sent to your registered email. Please check your email and verify it',
    },
  });
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
