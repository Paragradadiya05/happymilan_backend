import express from 'express';
import { userProfationalDetailController } from 'controllers/user';
import { userProfationalDetailValidation } from 'validations/user';
import validate from 'middlewares/validate';

const router = express.Router();
router
  .route('/')
  /**
   * createUserProfessionalDetail
   * */
  .post(
    validate(userProfationalDetailValidation.createProfessionalDetail),
    userProfationalDetailController.createUserProfessionalDetail
  )
  /**
   * getUserProfessionalDetail
   * */
  .get(
    validate(userProfationalDetailValidation.getProfessional),
    userProfationalDetailController.listUserProfessionalDetail
  );
router
  .route('/paginated')
  /**
   * getUserProfessionalDetailPaginated
   * */
  .get(
    validate(userProfationalDetailValidation.paginatedProfessional),
    userProfationalDetailController.paginateUserProfessionalDetail
  );
router
  .route('/:userProfessionalDetailId')
  /**
   * getUserProfessionalDetailById
   * */
  .get(
    validate(userProfationalDetailValidation.getProfessionalById),
    userProfationalDetailController.getUserProfessionalDetail
  )
  /**
   * updateUserProfessionalDetail
   * */
  .put(
    validate(userProfationalDetailValidation.updateProfessional),
    userProfationalDetailController.updateUserProfessionalDetail
  )
  /**
   * deleteUserProfessionalDetailById
   * */
  .delete(
    validate(userProfationalDetailValidation.deleteProfessionalById),
    userProfationalDetailController.removeUserProfessionalDetail
  );
export default router;
