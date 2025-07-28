import express from 'express';

import auth from 'middlewares/auth';

import { planController } from 'controllers/admin';
import validate from 'middlewares/validate';
import { planValidation } from 'validations/admin';

const router = express.Router();
/**
 * create plan
 * */
router.post(
  '/create-plan',
  // auth(['super-admin', 'admin']),
  validate(planValidation.createPlan),
  planController.createPlan
);
/**
 * get plan
 * */
router.get('/get-plan', auth(), planController.listPlan);
/**
 * get plan by id
 * */
router.get('/get-plan/:planId', auth(['admin']), validate(planValidation.getPlanById), planController.getPlanById);
/**
 * update plan
 * */
router.put('/update-plan/:planId', auth(['admin']), validate(planValidation.updatePlan), planController.update);
/**
 * delete plan
 * */
router.delete('/delete-plan/:planId', auth(['admin']), validate(planValidation.deletePlan), planController.Delete);
/**
 * delete selected plan
 * */
router.delete(
  '/delete-selected-plans',
  auth(['admin']),
  validate(planValidation.deleteSelectedPlans),
  planController.deleteSelectedPlans
);
export default router;
