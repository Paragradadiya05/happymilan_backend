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
 * getNotificationById
 * */
router.get(
  '/get-notification-byid/:userId',
  auth(),
  validate(notificationValidation.getNotificationById),
  notificationController.getNotificationById
);
/**
 * getNotification
 * */
router.get(
  '/get-notification',
  auth(),
  validate(notificationValidation.getNotification),
  notificationController.getNotification
);
router.put(
  '/update-notification/:notificationId',
  auth(),
  validate(notificationValidation.updateNotification),
  notificationController.update
);
/**
 * deleteNotificationById
 * */
router.delete(
  '/delete-notification/:notificationId',
  auth(),
  validate(notificationValidation.deleteNotification),
  notificationController.remove
);
export default router;
