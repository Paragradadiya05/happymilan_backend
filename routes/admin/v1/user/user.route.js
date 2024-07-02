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
  .post(auth(['admin']), validate(userValidation.createUser), userController.create)
  /**
   * getUser
   * */
  .get(auth(['admin']), validate(userValidation.getUser), userController.list);
// todo : validate this api
//  and give to fe side in postman also add response based on fe dashboard and add field according to that.
//  make aggregation query if require
router
  .route('/paginated')
  /**
   * getUserPaginated
   * */
  .get(auth(['admin']), validate(userValidation.paginatedUser), userController.paginate);

// todo : validate this api and give to fe side in postman
router
  .route('/:userId')
  /**
   * updateUser
   * */
  .put(auth(['admin']), validate(userValidation.updateUser), userController.update)
  // todo : validate this api and give to fe side in postman
  /**
   * deleteUserById
   * */
  .delete(auth(['admin']), validate(userValidation.deleteUserById), userController.remove)
  // todo : validate this api and give to fe side in postman
  /**
   * getUserById
   * */
  .get(auth(['admin']), validate(userValidation.getUserById), userController.get);
export default router;
