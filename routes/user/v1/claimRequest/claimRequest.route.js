import express from 'express';
import { claimRequestController } from '../../../../controllers/user';
import { claimRequestValidation } from '../../../../validations/user';
import validate from '../../../../middlewares/validate';
import optionalAuth from '../../../../middlewares/optionalAuth';
import auth from '../../../../middlewares/auth';

const router = express.Router();

router
  .route('/')
  .post(optionalAuth, validate(claimRequestValidation.createClaim), claimRequestController.createRequest)
  .get(auth(), claimRequestController.getMyRequests);

export default router;
