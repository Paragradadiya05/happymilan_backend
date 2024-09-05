import express from 'express';
import { KycController } from 'controllers/user';
import { KycValidation } from 'validations/user';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createKyc
   * */
  .post(auth(), validate(KycValidation.createKyc), KycController.create)
  /**
   * getKyc
   * */
  .get(auth(), validate(KycValidation.getKyc), KycController.list);
router
  .route('/paginated')
  /**
   * getKycPaginated
   * */
  .get(auth(), validate(KycValidation.paginatedKyc), KycController.paginate);
router
  .route('/:KycId')
  /**
   * updateKyc
   * */
  .put(auth(), validate(KycValidation.updateKyc), KycController.update)
  /**
   * deleteKycById
   * */
  .delete(auth(), validate(KycValidation.deleteKycById), KycController.remove)
  /**
   * getKycById
   * */
  .get(auth(), validate(KycValidation.getKycById), KycController.get);
router
  .route('/by-user/:userId')
  /**
   * getByUserId
   * */
  .get(auth(), validate(KycValidation.getKycByuserId), KycController.getKycByUserId);
export default router;
