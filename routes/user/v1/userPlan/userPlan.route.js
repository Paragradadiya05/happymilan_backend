import express from 'express';
import { UserPlanController } from 'controllers/user';

import auth from 'middlewares/auth';

const router = express();

router.get('/get-user-planbyId', auth(), UserPlanController.getUserPlanId);
module.exports = router;
