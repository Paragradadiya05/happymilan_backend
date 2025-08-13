import express from 'express';
import { mobileNumberRequestController } from 'controllers/user';
import { mobileNumberRequestValidation } from 'validations/user';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();

router
  .route('/create')
  /**
   * Create mobile number request
   */
  .post(
    auth(['user']),
    validate(mobileNumberRequestValidation.createMobileNumberRequest),
    mobileNumberRequestController.createMobileNumberRequest
  );

router
  .route('/accept/:requestId')
  /**
   * Accept mobile number request
   */
  .put(
    auth(['user']),
    validate(mobileNumberRequestValidation.acceptMobileNumberRequest),
    mobileNumberRequestController.acceptMobileNumberRequest
  );

router
  .route('/reject/:requestId')
  /**
   * Reject mobile number request
   */
  .put(
    auth(['user']),
    validate(mobileNumberRequestValidation.rejectMobileNumberRequest),
    mobileNumberRequestController.rejectMobileNumberRequest
  );

router
  .route('/received')
  /**
   * Get mobile number requests received by current user
   */
  .get(
    auth(['user']),
    validate(mobileNumberRequestValidation.getRequests),
    mobileNumberRequestController.getReceivedRequests
  );

router
  .route('/sent')
  /**
   * Get mobile number requests sent by current user
   */
  .get(auth(['user']), validate(mobileNumberRequestValidation.getRequests), mobileNumberRequestController.getSentRequests);

router
  .route('/accessible')
  /**
   * Get accessible mobile numbers (numbers the user has access to)
   */
  .get(
    auth(['user']),
    validate(mobileNumberRequestValidation.getRequests),
    mobileNumberRequestController.getAccessibleMobileNumbers
  );

export default router;
