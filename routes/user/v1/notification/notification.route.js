import express from 'express';
import validate from 'middlewares/validate';
import { notificationValidation } from 'validations/user';
import { notificationController } from 'controllers/user';
import auth from 'middlewares/auth';
import appUserType from 'middlewares/appUserType';

const router = express.Router();
router
  .route('/create-notification')
  /**
   * createNotification
   * */
  .post(
    auth(),
    appUserType(),
    validate(notificationValidation.createNotification),
    notificationController.createNotification
  );

/**
 * getNotificationById
 * */
router.get(
  '/get-notification-byid',
  auth(),
  appUserType(),
  validate(notificationValidation.getNotificationById),
  notificationController.getNotificationById
);
/**
 * getNotification
 * */
router.get(
  '/get-notification',
  auth(),
  appUserType(),
  validate(notificationValidation.getNotification),
  notificationController.getNotification
);
router.put(
  '/update-notification/:notificationId',
  auth(),
  appUserType(),
  validate(notificationValidation.updateNotification),
  notificationController.update
);
/**
 * deleteNotificationById
 * */
router.delete(
  '/delete-notificationbyId/:notificationId',
  auth(),
  appUserType(),
  validate(notificationValidation.deleteNotification),
  notificationController.remove
);
/**
 * GetNotificationById
 * */
router.get(
  '/get-notification/:notificationId',
  auth(),
  appUserType(),
  validate(notificationValidation.getNotificationId),
  notificationController.getById
);

router.delete(
  '/delete-notification-byid',
  auth(),
  appUserType(),
  validate(notificationValidation.deleteAllNotifications),
  notificationController.deleteAllNotifications
);

export default router;
