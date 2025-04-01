import httpStatus from 'http-status';
import { catchAsync } from 'utils/catchAsync';
import { twoFactorAuthService } from 'services';
import { User } from '../../models';
import ApiError from '../../utils/ApiError';

/**
 * Generate 2FA secret and QR code for authenticator app
 * @route POST /v1/user/2fa/generate
 */
export const generateTwoFactorAuthSecret = catchAsync(async (req, res) => {
  const { user } = req;
  const result = await twoFactorAuthService.generateSecret(user);
  res.status(httpStatus.OK).send(result);
});

/**
 * Set up OTP for 2FA (sends to both email and mobile if available)
 * @route POST /v1/user/2fa/setup-otp
 */
export const setupOtp = catchAsync(async (req, res) => {
  const { user } = req;
  const { otpType } = req.body;
  const result = await twoFactorAuthService.setupOtp(user, otpType);
  res.status(httpStatus.OK).send(result);
});

/**
 * Generate and send OTP for 2FA verification during login
 * @route POST /v1/user/2fa/send-otp
 */
export const sendOtp = catchAsync(async (req, res) => {
  const { user } = req;
  const result = await twoFactorAuthService.generateAndSendOtp(user);
  res.status(httpStatus.OK).send(result);
});

/**
 * Verify and enable 2FA
 * @route POST /v1/user/2fa/verify
 */
export const verifyAndEnableTwoFactorAuth = catchAsync(async (req, res) => {
  const { token } = req.body;
  const { user } = req;

  if (!token) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: 'Verification code is required' });
  }

  await twoFactorAuthService.verifyAndEnableTwoFactor(user.id, token);
  return res.status(httpStatus.OK).send({ message: 'Two-factor authentication enabled successfully' });
});

/**
 * Disable 2FA
 * @route POST /v1/user/2fa/disable
 */
export const disableTwoFactorAuth = catchAsync(async (req, res) => {
  const { user } = req;
  await twoFactorAuthService.disableTwoFactor(user.id);
  res.status(httpStatus.OK).send({ message: 'Two-factor authentication disabled successfully' });
});

/**
 * Get 2FA status
 * @route GET /v1/user/2fa/status
 */
export const getTwoFactorAuthStatus = catchAsync(async (req, res) => {
  const { user } = req;
  res.status(httpStatus.OK).send({
    isEnabled: !!(user.twoFactorAuth && user.twoFactorAuth.isEnabled),
    method: user.twoFactorAuth ? user.twoFactorAuth.method : null,
  });
});

export const sendOtpPublic = catchAsync(async (req, res) => {
  const { email, mobileNumber } = req.body;
  // Construct the query dynamically to match only the given field
  const query = {};
  if (email) query.email = email.toLowerCase();
  if (mobileNumber) query.mobileNumber = mobileNumber.trim();
  // Fetch the user with the exact match
  const user = await User.findOne(query);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  const result = await twoFactorAuthService.generateAndSendOtp(user);
  res.status(httpStatus.OK).send(result);
});
