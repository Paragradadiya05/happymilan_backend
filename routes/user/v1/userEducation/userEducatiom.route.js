import express from 'express';
import { usereducationController } from 'controllers/user';
import { usereducationValidation } from 'validations/user';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createUserEducationDetail
   * */
  .post(auth(), validate(usereducationValidation.createEducationDetail), usereducationController.createUserEducationDetail)
  /**
   * getUserEducationDetail
   * */
  .get(auth(), validate(usereducationValidation.getEducation), usereducationController.listUserEducationDetail);
router
  .route('/:userId')
  /**
   * getUserEducationDetailById
   * */
  .get(auth(), validate(usereducationValidation.getEducationById), usereducationController.getUserEducationDetail);
router
  .route('/:userEducationDetailId')

  /**
   * updateUserEducationDetail
   * */
  .put(auth(), validate(usereducationValidation.updateEducation), usereducationController.updateUserEducationDetail)
  /**
   * deleteUserEducationDetailById
   * */
  .delete(auth(), validate(usereducationValidation.deleteEducationById), usereducationController.removeUserEducationDetail);

export default router;
