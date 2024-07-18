import httpStatus from 'http-status';
import { generateOtp } from 'utils/common';
import { catchAsync } from 'utils/catchAsync';
import { authService, tokenService, userService, emailService } from 'services';
import { EnumCodeTypeOfCode } from 'models/enum.model';

export const register = catchAsync(async (req, res) => {
  const { body } = req;
  const user = await userService.createUser(body);

  const otp = generateOtp();
  user.codes.push({
    code: otp,
    expirationDate: Date.now() + 10 * 60 * 1000,
    used: false,
    codeType: EnumCodeTypeOfCode.LOGIN,
  });
  await user.save();

  // create privacy policy from here
  await emailService.sendOtpVerificationEmail(user, otp).then().catch();
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
  const admin = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(admin);
  if (deviceToken) {
    const updatedUser = await userService.addDeviceToken(admin, req.body);
    res.status(httpStatus.OK).send({ results: { user: updatedUser, tokens } });
  } else {
    res.status(httpStatus.OK).send({ results: { admin, tokens } });
  }
});

export const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.status(httpStatus.OK).send({ results: { ...tokens } });
});

export const updateUserInfo = catchAsync(async (req, res) => {
  const { body } = req;
  body.updatedBy = req.user;
  const { userId } = req.params;
  const filter = {
    _id: userId,
  };
  const options = { new: true };
  const product = await authService.updateuser(filter, body, options);
  return res.status(httpStatus.OK).send({ results: product });
});
