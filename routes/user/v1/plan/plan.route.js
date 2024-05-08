import express from 'express';
import { planController } from 'controllers/user';
import auth from 'middlewares/auth';

const router = express();

router.get('/get-plan', auth(), planController.listPlan);

module.exports = router;
