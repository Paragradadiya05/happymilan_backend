import express from 'express';
import { DatingPartnerController } from 'controllers/user';
import { datingPartnerValidation } from 'validations/user';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createUserPartnerPreDetail
   * */
  .post(auth(), validate(datingPartnerValidation.createPartnerpre), DatingPartnerController.createPartner)
  /**
   * getUserPartnerPreDetail
   * */
  .get(auth(), validate(datingPartnerValidation.getPartnerpre), DatingPartnerController.listPartner);
router
  .route('/:PartnerId')
  /**
   * updateUserPartnerPreDetail
   * */
  .put(auth(), validate(datingPartnerValidation.updatePartnerpre), DatingPartnerController.updatePartner)
  /**
   * deleteUserPartnerPreDetailById
   * */
  .delete(auth(), validate(datingPartnerValidation.deletePartnerpreById), DatingPartnerController.removePartner)
  /**
   * get by PartnerId
   * */
  .get(auth(), validate(datingPartnerValidation.getById), DatingPartnerController.getPartnerById);
router
  .route('/getByUser/:userId')
  /**
   * getUserPartnerPreDetailById
   * */
  .get(auth(), validate(datingPartnerValidation.getPartnerpreById), DatingPartnerController.getPartner);

export default router;
