import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import httpStatus from 'http-status';
import ApiError from 'utils/ApiError';
import { User } from 'models';

/**
 * Generate a new secret for 2FA
 * @param {Object} user - User object
 * @returns {Object} - Object containing secret and QR code data URL
 */
export const generateSecret = async (user) => {
  try {
    // Generate a new secret
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `HappyMilan:${user.email || user.mobileNumber}`,
      issuer: 'HappyMilan',
    });

    // Generate QR code
    const dataURL = await QRCode.toDataURL(secret.otpauth_url);

    // Update user with temporary secret
    await User.findByIdAndUpdate(user.id, {
      'twoFactorAuth.tempSecret': secret.base32,
      'twoFactorAuth.dataURL': dataURL,
    });

    return {
      tempSecret: secret.base32,
      dataURL,
      otpauth_url: secret.otpauth_url,
    };
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error generating 2FA secret');
  }
};

/**
 * Verify the OTP token and enable 2FA
 * @param {string} userId - User ID
 * @param {string} token - OTP token
 * @returns {boolean} - Whether verification was successful
 */
export const verifyAndEnableTwoFactor = async (userId, token) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Verify the token against the temporary secret
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorAuth.tempSecret,
    encoding: 'base32',
    token,
    window: 1, // Allow 1 step before and after current time
  });

  if (!verified) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid verification code');
  }

  // Enable 2FA and save the secret
  await User.findByIdAndUpdate(userId, {
    'twoFactorAuth.isEnabled': true,
    'twoFactorAuth.secret': user.twoFactorAuth.tempSecret,
    'twoFactorAuth.otpVerified': true,
    'twoFactorAuth.tempSecret': null,
  });

  return true;
};

/**
 * Disable 2FA for a user
 * @param {string} userId - User ID
 * @returns {boolean} - Whether disabling was successful
 */
export const disableTwoFactor = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  await User.findByIdAndUpdate(userId, {
    'twoFactorAuth.isEnabled': false,
    'twoFactorAuth.secret': null,
    'twoFactorAuth.tempSecret': null,
    'twoFactorAuth.dataURL': null,
    'twoFactorAuth.otpVerified': false,
  });

  return true;
};

/**
 * Verify a token for login
 * @param {Object} user - User object
 * @param {string} token - OTP token
 * @returns {boolean} - Whether verification was successful
 */
export const verifyToken = (user, token) => {
  if (!user.twoFactorAuth || !user.twoFactorAuth.isEnabled || !user.twoFactorAuth.secret) {
    return true; // 2FA not enabled, so verification passes
  }

  return speakeasy.totp.verify({
    secret: user.twoFactorAuth.secret,
    encoding: 'base32',
    token,
    window: 1, // Allow 1 step before and after current time
  });
};
