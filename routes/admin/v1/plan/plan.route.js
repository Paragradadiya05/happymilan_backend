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
 * update plan
 * */
router.put('/update-plan/:planId', auth(['admin']), validate(planValidation.updatePlan), planController.update);

export default router;
