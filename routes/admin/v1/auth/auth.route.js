import express from 'express';
import validate from 'middlewares/validate';
import { authValidation } from 'validations/admin';
import { authController } from 'controllers/admin';
// import verifyCaptcha from 'middlewares/captcha';
const router = express.Router();

/**
 * Register API
 */
router.post('/register', validate(authValidation.register), authController.register);

/**
 * If admin is successfully signup and Verified OTP then can login with Credential.
 */
router.post('/login', validate(authValidation.login), authController.login);

/**
 * Get the Refresh Token for the User
 */
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);
export default router;
