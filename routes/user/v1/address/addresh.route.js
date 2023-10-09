import express from 'express';
import { addressController } from 'controllers/user';
import { addressValidation } from 'validations/user';
import validate from 'middlewares/validate';

const router = express.Router();
router
  .route('/')
  /**
   * createAddress
   * */
  .post(validate(addressValidation.createAddress), addressController.createAddress)
  /**
   * getAddress
   * */
  .get(validate(addressValidation.getAddress), addressController.listAddress);
router
  .route('/paginated')
  /**
   * getAddressPaginated
   * */
  .get(validate(addressValidation.paginatedAddress), addressController.paginateAddress);
router
  .route('/:addressId')
  /**
   * getAddressById
   * */
  .get(validate(addressValidation.getAddressById), addressController.getAddress)
  /**
   * updateAddress
   * */
  .put(validate(addressValidation.updateAddress), addressController.updateAddress)
  /**
   * deleteAddressById
   * */
  .delete(validate(addressValidation.deleteAddressById), addressController.removeAddress);
export default router;
