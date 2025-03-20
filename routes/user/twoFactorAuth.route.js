import express from 'express';
import auth from 'middlewares/auth';
import { twoFactorAuthController } from 'controllers/user';
import { twoFactorAuthAValidation } from 'validations/user';
import validate from 'middlewares/validate';

const router = express.Router();

// All routes require authentication
router.use(auth());

// Generate 2FA secret and QR code for authenticator app
router.post('/generate', twoFactorAuthController.generateTwoFactorAuthSecret);

// Set up OTP for 2FA (sends to both email and mobile if available)
router.post('/setup-otp', validate(twoFactorAuthAValidation.setupOtp), twoFactorAuthController.setupOtp);

// Generate and send OTP for 2FA verification during login
router.post('/send-otp', validate(twoFactorAuthAValidation.sendOtp), twoFactorAuthController.sendOtp);

// Verify and enable 2FA
router.post(
  '/verify',
  validate(twoFactorAuthAValidation.verifyTwoFactorAuth),
  twoFactorAuthController.verifyAndEnableTwoFactorAuth
);

// Disable 2FA
router.post('/disable', twoFactorAuthController.disableTwoFactorAuth);

// Get 2FA status
router.get('/status', twoFactorAuthController.getTwoFactorAuthStatus);

module.exports = router;
