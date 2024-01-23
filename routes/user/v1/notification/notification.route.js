import express from 'express';
import validate from 'middlewares/validate';
import { notificationValidation } from 'validations/user';
import { notificationController } from 'controllers/user';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/create-notification')
  /**
   * createNotification
   * */
  .post(auth(), validate(notificationValidation.createNotification), notificationController.createNotification);
/**
 * getNotification
 * */
router.get(
  '/get-notification',
  auth(),
  validate(notificationValidation.getNotification),
  notificationController.getNotification
);

export default router;
