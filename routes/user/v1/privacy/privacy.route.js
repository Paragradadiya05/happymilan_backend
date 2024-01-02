import express from 'express';
import { privacyValidation } from 'validations/user';
import { privacyController } from 'controllers/user';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
/**
 * create privacy
 * */
router.post('/create-privacy', auth(), validate(privacyValidation.create), privacyController.create);
/**
 * get privacy
 * */
router.get('/get-privacy', auth(), privacyController.list);

/**
 * get privacy question by userid
 * */
router.get('/get-privacy-for-current-user', auth(), privacyController.getUserPrivacyQuestion);

/**
 * update privacy
 * */
router.put('/update-privacy/:privacyId', auth(), validate(privacyValidation.updatePrivacy), privacyController.update);

export default router;
