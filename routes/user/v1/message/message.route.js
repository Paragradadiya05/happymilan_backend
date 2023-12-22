import express from 'express';
import { messageController } from 'controllers/user';
import { messageValidation } from 'validations/user';
import validate from 'middlewares/validate';

const router = express.Router();
router
  .route('/create-message')
  /**
   * createmessage
   * */
  .post(validate(messageValidation.createMessage), messageController.createMessage);

router
  .route('/get-message')
  /**
   * getmessage
   * */
  .get(validate(messageValidation.getMessage), messageController.getMessage);

export default router;
