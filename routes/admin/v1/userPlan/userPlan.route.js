import express from 'express';
import { UserPlanController } from 'controllers/admin';
import auth from 'middlewares/auth';
import validate from '../../../../middlewares/validate';
import { userPlanValidation } from '../../../../validations/admin';

const router = express();
/**
 * getByUserId
 * */
router.get('/get-user-planbyId', auth(), UserPlanController.getUserPlanId);
/**
 * get list
 * */
router.get('/get-user-plan-list', auth(), UserPlanController.list);
/**
 * get receipt
 * */
router.get('/receipt/:userId', auth(), UserPlanController.downloadUserPlanReceipt);
router
  .route('/get-by-user-type/:appUsesType')
  /**
   * getUserRoleByID
   * */
  .get(
    auth(['super-admin', 'admin']),
    validate(userPlanValidation.getUserByappUsesType),
    UserPlanController.listByAppUsesType
  );
module.exports = router;
