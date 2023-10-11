import express from 'express';
import { addressController } from 'controllers/user';
import { addressValidation } from 'validations/user';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createAddress
   * */
  .post(auth(), validate(addressValidation.createAddress), addressController.createAddress)
  /**
   * getAddress
   * */
  .get(auth(), validate(addressValidation.getAddress), addressController.listAddress);
router
  .route('/paginated')
  /**
   * getAddressPaginated
   * */
  .get(auth(), validate(addressValidation.paginatedAddress), addressController.paginateAddress);
router
  .route('/:addressId')
  /**
   * getAddressById
   * */
  .get(auth(), validate(addressValidation.getAddressById), addressController.getAddress)
  /**
   * updateAddress
   * */
  .put(auth(), validate(addressValidation.updateAddress), addressController.updateAddress)
  /**
   * deleteAddressById
   * */
  .delete(auth(), validate(addressValidation.deleteAddressById), addressController.removeAddress);
export default router;
