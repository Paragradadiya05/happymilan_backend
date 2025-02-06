import express from 'express';
import { spamUserValidation } from 'validations/user';
import { spamUserController } from 'controllers/user';
import validate from 'middlewares/validate';
import auth from '../../../../middlewares/auth';
import appUserType from '../../../../middlewares/appUserType';

const router = express.Router();
/**
 * create spam
 * */
router.post('/create-spam', auth(), appUserType(), validate(spamUserValidation.createSpamUser), spamUserController.create);
/**
 * get spam
 * */
router.get('/get-spam', auth(), validate(spamUserValidation.getSpamUser), spamUserController.list);
/**
 * update spam
 * */
router.put('/update-spam/:spamId', auth(), validate(spamUserValidation.updateSpam), spamUserController.update);
/**
 * deletesmapById
 * */
router.delete('/delete-spam/:spamId', auth(), validate(spamUserValidation.deleteSpamById), spamUserController.remove);

export default router;
