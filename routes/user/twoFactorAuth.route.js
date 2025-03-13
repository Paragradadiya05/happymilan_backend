import express from 'express';
import auth from 'middlewares/auth';
import { twoFactorAuthController } from 'controllers/user';

const router = express.Router();

// All routes require authentication
router.use(auth());

// Generate 2FA secret and QR codetest
router.post('/generate', twoFactorAuthController.generateTwoFactorAuthSecret);

// Verify and enable 2FA
router.post('/verify', twoFactorAuthController.verifyAndEnableTwoFactorAuth);

// Disable 2FA
router.post('/disable', twoFactorAuthController.disableTwoFactorAuth);

// Get 2FA status
router.get('/status', twoFactorAuthController.getTwoFactorAuthStatus);

module.exports = router;
