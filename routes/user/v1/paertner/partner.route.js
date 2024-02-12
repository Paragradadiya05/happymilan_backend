import express from 'express';
import { partnerController } from 'controllers/user';
import { partnerValidation } from 'validations/user';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createUserEducationDetail
   * */
  .post(auth(), validate(partnerValidation.createPartnerpre), partnerController.createPartner)
  /**
   * getUserEducationDetail
   * */
  .get(auth(), validate(partnerValidation.getPartnerpre), partnerController.listPartner);
router
  .route('/:PartnerId')
  /**
   * getUserEducationDetailById
   * */
  .get(auth(), validate(partnerValidation.getPartnerpreById), partnerController.getPartner)
  /**
   * updateUserEducationDetail
   * */
  .put(auth(), validate(partnerValidation.updatePartnerpre), partnerController.updatePartner)
  /**
   * deleteUserEducationDetailById
   * */
  .delete(auth(), validate(partnerValidation.deletePartnerpreById), partnerController.removePartner);

export default router;
