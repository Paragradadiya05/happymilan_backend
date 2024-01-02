import express from 'express';
import { userController } from 'controllers/admin';
import { userValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createUser
   * */
  .post(auth('admin'), validate(userValidation.createUser), userController.create)
  /**
   * getUser
   * */
  .get(auth('admin'), validate(userValidation.getUser), userController.list);
router
  .route('/paginated')
  /**
   * getUserPaginated
   * */
  .get(auth('admin'), validate(userValidation.paginatedUser), userController.paginate);
router
  .route('/:userId')
  /**
   * updateUser
   * */
  .put(auth('admin'), validate(userValidation.updateUser), userController.update)
  /**
   * deleteUserById
   * */
  .delete(auth('admin'), validate(userValidation.deleteUserById), userController.remove)
  /**
   * getUserById
   * */
  .get(auth('admin'), validate(userValidation.getUserById), userController.get);
export default router;
