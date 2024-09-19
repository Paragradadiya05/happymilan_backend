import express from 'express';
import { planController } from 'controllers/user';
import auth from 'middlewares/auth';
import validate from '../../../../middlewares/validate';
import { planValidation } from '../../../../validations/user';

const router = express();

router.get('/get-plan', auth(), planController.listPlan);

router.get('/get-plan/:planId', auth(), validate(planValidation.getPlanById), planController.getPlanById);

router.get('/get-plan-by-name/:planName', auth(), validate(planValidation.getPlanByName), planController.getPlanByName);

module.exports = router;
