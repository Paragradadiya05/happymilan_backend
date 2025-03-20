import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import httpStatus from 'http-status';
import ApiError from 'utils/ApiError';
import { User } from 'models';
import { generateOtp } from 'utils/common';
import { sendOtpToMobile } from './mobileotp.service';
import { sendOtpVerificationEmail } from './email.service';
import { EnumOf2faMethod } from '../models/enum.model';

/**
 * Generate a new secret for authenticator app 2FA
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
      'twoFactorAuth.method': 'authenticator_app',
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
 * Set up OTP-based 2FA that sends to both email and mobile
 * @param {Object} user - User object
 * @returns {Object} - Success message
 */
export const setupOtp = async (user) => {
  try {
    if (!user.email && !user.mobileNumber) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'User must have either an email address or mobile number');
    }

    // Update user's 2FA method
    await User.findByIdAndUpdate(user.id, {
      'twoFactorAuth.method': 'otp',
      'twoFactorAuth.isEnabled': false,
    });

    // eslint-disable-next-line no-use-before-define
    await generateAndSendOtp(user);
    return {
      success: true,
      message: 'OTP-based 2FA has been set up successfully',
    };
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error setting up OTP for 2FA');
  }
};

/**
 * Generate and send OTP for 2FA during login
 * @param {Object} user - User object
 * @returns {Object} - Success message
 */
export const generateAndSendOtp = async (user) => {
  try {
    const otp = generateOtp();
    const expirationTime = Date.now() + 2 * 60 * 1000; // 2 minutes

    // Update user with 2FA OTP
    await User.findByIdAndUpdate(user.id, {
      'twoFactorAuth.secret': otp,
      'twoFactorAuth.tempSecret': expirationTime.toString(),
    });

    const messages = [];

    // Send OTP to email if available
    if (user.email) {
      await sendOtpVerificationEmail(user, otp);
      messages.push('email');
    }

    // Send OTP to mobile if available
    if (user.mobileNumber && user.countryCode) {
      await sendOtpToMobile(`${user.countryCode}${user.mobileNumber}`, otp);
      messages.push('mobile');
    }

    return {
      success: true,
      message: `OTP sent to your ${messages.join(' and ')}`,
    };
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error generating and sending OTP');
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

  console.log('user.twoFactorAuth.method === ', user.twoFactorAuth.method);

  if (user.twoFactorAuth.method === EnumOf2faMethod.AUTHENTICATOR_APP) {
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

    // Enable 2FA and save the secretuser.twoFactorAuth.method === 'otp'
    await User.findByIdAndUpdate(userId, {
      'twoFactorAuth.isEnabled': true,
      'twoFactorAuth.secret': user.twoFactorAuth.tempSecret,
      'twoFactorAuth.otpVerified': true,
      'twoFactorAuth.tempSecret': null,
    });
  } else if (user.twoFactorAuth.method === EnumOf2faMethod.OTP) {
    // Verify OTP
    const isValidOtp = user.twoFactorAuth.secret === token;
    const expirationTime = parseInt(user.twoFactorAuth.tempSecret || '0', 10);
    const isNotExpired = Date.now() < expirationTime;

    if (!isNotExpired) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Otp is Expired, please resend otp to enable 2FA service');
    }
    if (isValidOtp && isNotExpired) {
      // Clear the OTP after successful verification
      await User.findByIdAndUpdate(user.id, {
        'twoFactorAuth.secret': null,
        'twoFactorAuth.tempSecret': null,
        'twoFactorAuth.isEnabled': true,
      });
      return true;
    }
    return false;
  } else {
    // We'll handle OTP verification in verifyToken for login
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid 2FA method for this endpoint');
  }

  return true;
};

/**
 * Disable 2FA for a user
 * @param {string} userId - User ID
 * @returns {boolean} - Whether disabling was successful
 */
export async function disableTwoFactor(userId) {
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
    'twoFactorAuth.method': 'authenticator_app', // Reset to default
  });

  return true;
}

/**
 * Verify a token for login
 * @param {Object} user - User object
 * @param {string} token - OTP token
 * @returns {boolean} - Whether verification was successful
 */
export async function verifyToken(user, token) {
  if (!user.twoFactorAuth || !user.twoFactorAuth.isEnabled) {
    return true; // 2FA not enabled, so verification passes
  }

  if (user.twoFactorAuth.method === 'authenticator_app') {
    // Verify with authenticator app
    return speakeasy.totp.verify({
      secret: user.twoFactorAuth.secret,
      encoding: 'base32',
      token,
      window: 1, // Allow 1 step before and after current time
    });
  }

  if (user.twoFactorAuth.method === EnumOf2faMethod.OTP) {
    // Verify OTP
    const isValidOtp = user.twoFactorAuth.secret === token;
    const expirationTime = parseInt(user.twoFactorAuth.tempSecret || '0', 10);
    const isNotExpired = Date.now() < expirationTime;

    if (isValidOtp && isNotExpired) {
      // Clear the OTP after successful verification
      await User.findByIdAndUpdate(user.id, {
        'twoFactorAuth.secret': null,
        'twoFactorAuth.tempSecret': null,
      });
      return true;
    }
    return false;
  }

  throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid 2FA method');
}
