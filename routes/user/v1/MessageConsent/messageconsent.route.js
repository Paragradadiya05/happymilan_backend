import express from 'express';
import { messageconsentValidation } from 'validations/user';
import { messageconsentController } from 'controllers/user';
import validate from 'middlewares/validate';
import auth from '../../../../middlewares/auth';

const router = express.Router();
/**
 * create messageConsent
 * */
router.post(
  '/create-messageConsent',
  auth(),
  validate(messageconsentValidation.createMessageConsent),
  messageconsentController.create
);
/**
 * get messageConsent
 * */
router.get(
  '/get-messageConsent',
  auth(),
  validate(messageconsentValidation.getMessageConsent),
  messageconsentController.list
);
/**
 * update messageConsent
 * */
router.put(
  '/update-messageConsent/:messageConsentId',
  auth(),
  validate(messageconsentValidation.updateMessageConsent),
  messageconsentController.update
);
/**
 * delete-messageConsentById
 * */
router.delete(
  '/delete-messageConsent/:messageConsentId',
  auth(),
  validate(messageconsentValidation.deleteMessageConsentById),
  messageconsentController.remove
);

export default router;
