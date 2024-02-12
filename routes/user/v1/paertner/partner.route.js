import express from 'express';
import { partnerController } from 'controllers/user';
import { partnerValidation } from 'validations/user';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createUserPartnerPreDetail
   * */
  .post(auth(), validate(partnerValidation.createPartnerpre), partnerController.createPartner)
  /**
   * getUserPartnerPreDetail
   * */
  .get(auth(), validate(partnerValidation.getPartnerpre), partnerController.listPartner);
router
  .route('/:PartnerId')
  /**
   * updateUserPartnerPreDetail
   * */
  .put(auth(), validate(partnerValidation.updatePartnerpre), partnerController.updatePartner)
  /**
   * deleteUserPartnerPreDetailById
   * */
  .delete(auth(), validate(partnerValidation.deletePartnerpreById), partnerController.removePartner);

router
  .route('/getByUser/:userId')
  /**
   * getUserPartnerPreDetailById
   * */
  .get(auth(), validate(partnerValidation.getPartnerpreById), partnerController.getPartner);

export default router;
