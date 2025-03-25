import express from 'express';
import auth from 'middlewares/auth';
import { twoFactorAuthController } from 'controllers/user';
import { twoFactorAuthAValidation } from 'validations/user';
import validate from 'middlewares/validate';

const router = express.Router();

// Generate 2FA secret and QR code for authenticator app
router.post('/generate', auth(), twoFactorAuthController.generateTwoFactorAuthSecret);

// Set up OTP for 2FA (sends to both email and mobile if available)
router.post('/setup-otp', auth(), validate(twoFactorAuthAValidation.setupOtp), twoFactorAuthController.setupOtp);

// ✅ Move the send-otp route BEFORE applying authentication
router.post('/send-otp', auth(), validate(twoFactorAuthAValidation.sendOtp), twoFactorAuthController.sendOtp);

router.post('/resend-otp', validate(twoFactorAuthAValidation.sendOtpPublic), twoFactorAuthController.sendOtpPublic);
// Verify and enable 2FA
router.post(
  '/verify',
  auth(),
  validate(twoFactorAuthAValidation.verifyTwoFactorAuth),
  twoFactorAuthController.verifyAndEnableTwoFactorAuth
);

// Disable 2FA
router.post('/disable', auth(), twoFactorAuthController.disableTwoFactorAuth);

// Get 2FA status
router.get('/status', auth(), twoFactorAuthController.getTwoFactorAuthStatus);

module.exports = router;
