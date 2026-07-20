import express from 'express';
import { claimRequestController } from '../../../../controllers/user';
import { claimRequestValidation } from '../../../../validations/user';
import validate from '../../../../middlewares/validate';
import auth from '../../../../middlewares/auth';

const router = express.Router();

router.route('/').get(auth(), validate(claimRequestValidation.paginatedClaims), claimRequestController.listAllRequests);

router
  .route('/:requestId/verify')
  .post(auth(), validate(claimRequestValidation.verifyClaim), claimRequestController.verifyRequest);

export default router;
