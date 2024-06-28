import express from 'express';
import { userController } from 'controllers/user';
import { userValidation } from 'validations/user';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createUser
   * */
  .post(validate(userValidation.createUser), userController.create)
  /**
   * getUser
   * */
  .get(validate(userValidation.getUser), userController.list);
router
  .route('/checkPlan')
  /**
   * getUserByUserUniqueId
   * */
  .get(auth(), userController.checkPlan);
router
  .route('/users-not-frd')
  /**
   * getUserPaginated
   * */
  .get(auth(), validate(userValidation.paginatedUserThatNotFriend), userController.paginatedUserThatNotFriend);

router
  .route('/paginated')
  /**
   * getUserPaginated
   * */
  .get(validate(userValidation.paginatedUser), userController.paginate);
router.route('/getUserByGender').get(auth(), validate(userValidation.getUserByGender), userController.getUserByGender);
router
  .route('/:userId')
  /**
   * updateUser
   * */
  .put(validate(userValidation.updateUser), userController.update)
  /**
   * getUserById
   * */
  .get(validate(userValidation.getUserById), userController.get);
router
  .route('/delete-profile-image/:userId')
  /**
   * updateUser
   * */
  .post(validate(userValidation.deleteUserImages), userController.deleteUserImage)

  /**
   * deleteUserById
   * */
  .delete(validate(userValidation.deleteUserById), userController.remove);
router
  .route('/userUniqueId/:userUniqueId')
  /**
   * getUserByUserUniqueId
   * */
  .get(auth(), validate(userValidation.get), userController.getUnique);

export default router;
