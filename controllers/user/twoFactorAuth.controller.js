import httpStatus from 'http-status';
import { catchAsync } from 'utils/catchAsync';
import { twoFactorAuthService } from 'services';

/**
 * Generate 2FA secret and QR code
 * @route POST /v1/user/2fa/generate
 */
export const generateTwoFactorAuthSecret = catchAsync(async (req, res) => {
  const { user } = req;
  const result = await twoFactorAuthService.generateSecret(user);
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
  });
});
