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
  '/create-message-consent',
  auth(),
  validate(messageconsentValidation.createMessageConsent),
  messageconsentController.create
);
/**
 * get messageConsent
 * */
router.get(
  '/get-all-message-consent',
  auth(),
  validate(messageconsentValidation.getMessageConsent),
  messageconsentController.list
);
/**
 * update messageConsent
 * */
router.put(
  '/update-message-consent/:messageConsentId',
  auth(),
  validate(messageconsentValidation.updateMessageConsent),
  messageconsentController.update
);
/**
 * delete-messageConsentById
 * */
router.delete(
  '/delete-message-consent/:messageConsentId',
  auth(),
  validate(messageconsentValidation.deleteMessageConsentById),
  messageconsentController.remove
);
/**
 * get-messageConsentBy-reciverId
 * */
router.get(
  '/get-message-consent/:receiverId',
  auth(),
  validate(messageconsentValidation.getMessageConsentByReceiverId),
  messageconsentController.getConsent
);
/**
 * get status
 * */
router.get(
  '/get-message-consent',
  auth(),
  validate(messageconsentValidation.getConsent),
  messageconsentController.getUserConsent
);
export default router;
