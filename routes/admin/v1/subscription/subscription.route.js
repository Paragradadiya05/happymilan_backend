import express from 'express';
import { subscriptionValidation } from 'validations/admin';
import { subscriptionController } from 'controllers/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
/**
 * create subscription
 * */
router.post(
  '/create-subscription',
  auth(['admin']),
  validate(subscriptionValidation.createSubcription),
  subscriptionController.create
);
/**
 * get subscription
 * */
router.get(
  '/get-subscription',
  auth(['admin']),
  validate(subscriptionValidation.subscriptionlist),
  subscriptionController.list
);
/**
 * update subscription
 * */
router.put(
  '/update-subscription/:subscriptionId',
  auth(['admin']),
  validate(subscriptionValidation.updatesubscription),
  subscriptionController.update
);
export default router;
