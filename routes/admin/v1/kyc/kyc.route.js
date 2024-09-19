import express from 'express';

import { KycController } from 'controllers/admin';
import { KycValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createKyc
   * */
  .post(auth(['admin']), validate(KycValidation.createKyc), KycController.create)
  /**
   * getKyc
   * */
  .get(auth(['admin']), validate(KycValidation.getKyc), KycController.list);
router
  .route('/paginated')
  /**
   * getKycPaginated
   * */
  .get(auth(['admin']), validate(KycValidation.paginatedKyc), KycController.paginate);
router
  .route('/:KycId')
  /**
   * updateKyc
   * */
  .put(auth(['admin']), validate(KycValidation.updateKyc), KycController.update)
  /**
   * deleteKycById
   * */
  .delete(auth(['admin']), validate(KycValidation.deleteKycById), KycController.remove)
  /**
   * getKycById
   * */
  .get(auth(['admin']), validate(KycValidation.getKycById), KycController.get);
router
  .route('/by-user/:userId')
  /**
   * getByUserId
   * */
  .get(auth(['admin']), validate(KycValidation.getKycByuserId), KycController.getKycByUserId);
export default router;
