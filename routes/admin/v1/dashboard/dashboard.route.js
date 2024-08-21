import express from 'express';
import { userController } from 'controllers/admin';
import { userValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/:appUsesType?')

  .get(auth(['admin']), validate(userValidation.dashboard), userController.dashboard);

export default router;
