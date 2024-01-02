import express from 'express';
import validate from 'middlewares/validate';
import { emailnotificationValidation } from 'validations/user';
import { emailnotificationController } from 'controllers/user';

const router = express.Router();
router
  .route('/')
  /**
   * create message notification
   * */
  .post(validate(emailnotificationValidation.createNotification), emailnotificationController.createNotification)

  /**
   * get message notification
   * */
  .get(validate(emailnotificationValidation.getNotification), emailnotificationController.getNotification);

export default router;
