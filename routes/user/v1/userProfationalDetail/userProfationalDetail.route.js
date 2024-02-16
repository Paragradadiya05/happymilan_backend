import express from 'express';
import { userProfationalDetailController } from 'controllers/user';
import { userProfationalDetailValidation } from 'validations/user';
import validate from 'middlewares/validate';
import auth from '../../../../middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createUserProfessionalDetail
   * */
  .post(
    auth(),
    validate(userProfationalDetailValidation.createProfessionalDetail),
    userProfationalDetailController.createUserProfessionalDetail
  )
  /**
   * getUserProfessionalDetail
   * */
  .get(
    auth(),
    validate(userProfationalDetailValidation.getProfessional),
    userProfationalDetailController.listUserProfessionalDetail
  );
router
  .route('/paginated')
  /**
   * getUserProfessionalDetailPaginated
   * */
  .get(
    auth(),
    validate(userProfationalDetailValidation.paginatedProfessional),
    userProfationalDetailController.paginateUserProfessionalDetail
  );
router
  .route('/getbyid/:userId')
  /**
   * getUserProfessionalDetailById
   * */
  .get(
    auth(),
    validate(userProfationalDetailValidation.getProfessionalById),
    userProfationalDetailController.getUserProfessionalDetail
  );
router
  .route('/:userProfessionalDetailId')

  /**
   * updateUserProfessionalDetail
   * */
  .put(
    auth(),
    validate(userProfationalDetailValidation.updateProfessional),
    userProfationalDetailController.updateUserProfessionalDetail
  )
  /**
   * deleteUserProfessionalDetailById
   * */
  .delete(
    auth(),
    validate(userProfationalDetailValidation.deleteProfessionalById),
    userProfationalDetailController.removeUserProfessionalDetail
  );
export default router;
