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
  .post(auth(['super-admin']), validate(userValidation.createUser), userController.create)
  /**
   * getUser
   * */
  .get(auth(['admin']), validate(userValidation.getUser), userController.list);
router
  .route('/roles')
  /**
   * getUserRole
   * */
  .get(auth(['super-admin']), validate(userValidation.getUser), userController.listroles);
router
  .route('/paginated')
  /**
   * getUserPaginated
   * */
  .get(auth(['admin']), validate(userValidation.paginatedUser), userController.paginate);

router
  .route('/:userId')
  /**
   * updateUser
   * */
  .put(auth(['admin']), validate(userValidation.updateUser), userController.update)
  /**
   * deleteUserById
   * */
  .delete(auth(['admin']), validate(userValidation.deleteUserById), userController.remove)
  /**
   * getUserById
   * */
  .get(auth(['admin']), validate(userValidation.getUserById), userController.get);
router
  .route('/role/:userId')
  /**
   * getUserRoleByID
   * */
  .get(auth(['super-admin']), validate(userValidation.getUserById), userController.getRole);

router
  .route('/create-user')
  /**
   * createUser for happy milan
   * */
  .post(auth(['admin']), validate(userValidation.createUserWithAllModelData), userController.createUser);
router
  .route('/update-user/:userId')
  /**
   * Update user for Happy Milan
   */
  .put(auth(['super-admin']), validate(userValidation.updateUserWithAllModelData), userController.updateUser);

router
  .route('/reset-credits/:userId')
  /**
   * Reset credits for a specific user
   */
  .post(auth(['admin']), validate(userValidation.resetUserCredits), userController.resetUserCredits);

router
  .route('/reset-credits-bulk')
  /**
   * Reset credits for multiple users
   */
  .post(auth(['admin']), validate(userValidation.resetMultipleUserCredits), userController.resetMultipleUserCredits);
router
  .route('/getUser/:appUsesType')
  /**
   * getUserRoleByID
   * */
  .get(auth(['super-admin', 'admin']), validate(userValidation.getUserByappUsesType), userController.paginateappUsesType);
/**
 * getUserRoleByID
 * */
router
  .route('/delete-selected-user')
  /**
   * getUserRoleByID
   * */
  .delete(auth(['super-admin', 'admin']), validate(userValidation.deleteSelectedUser), userController.deleteSelectedUsers);
export default router;
