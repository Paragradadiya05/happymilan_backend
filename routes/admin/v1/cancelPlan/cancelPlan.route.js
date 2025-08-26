import express from 'express';
import { CancelPlanRequestController } from 'controllers/admin';
import { CancelPlanValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();

router
  .route('/')
  /**
   * createCancelPlan
   */
  .post(auth(), validate(CancelPlanValidation.createCancelPlan), CancelPlanRequestController.createCancelPlan)
  /**
   * getCancelPlanList
   */
  .get(auth(), CancelPlanRequestController.getCancelPlanList);

router
  .route('/by-user/:userId')
  /**
   * getCancelPlansByUser
   */
  .get(auth(), validate(CancelPlanValidation.getCancelPlanByUser), CancelPlanRequestController.getCancelPlanByUser);

router
  .route('/:cancelPlanId')
  /**
   * getCancelPlanById
   */
  .get(auth(), validate(CancelPlanValidation.getCancelPlanById), CancelPlanRequestController.getCancelPlan)
  /**
   * updateCancelPlan
   */
  .put(auth(), validate(CancelPlanValidation.updateCancelPlan), CancelPlanRequestController.updateCancelPlan)
  /**
   * deleteCancelPlanById
   */
  .delete(auth(), validate(CancelPlanValidation.deleteCancelPlanById), CancelPlanRequestController.deleteCancelPlan);

export default router;
