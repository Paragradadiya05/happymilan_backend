import express from 'express';
import { spamUserValidation } from 'validations/admin';
import { spamUserController } from 'controllers/admin';
import validate from 'middlewares/validate';
import auth from '../../../../middlewares/auth';
import appUserType from '../../../../middlewares/appUserType';

const router = express.Router();
/**
 * create spam
 * */
router.post(
  '/create-spam',
  auth(['admin']),
  appUserType(),
  validate(spamUserValidation.createSpamUser),
  spamUserController.create
);
/**
 * get spam
 * */
router.get('/get-spam', auth(['admin']), validate(spamUserValidation.getSpamUser), spamUserController.list);
/**
 * update spam
 * */
router.put('/update-spam/:spamId', auth(['admin']), validate(spamUserValidation.updateSpam), spamUserController.update);
/**
 * deletesmapById
 * */
router.delete(
  '/delete-spam/:spamId',
  auth(['admin']),
  validate(spamUserValidation.deleteSpamById),
  spamUserController.remove
);

export default router;
