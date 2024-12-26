import express from 'express';
import { UserPlanController } from 'controllers/user';
import auth from 'middlewares/auth';

const router = express();
/**
 * getByUserId
 * */
router.get('/get-user-planbyId', auth(), UserPlanController.getUserPlanId);
/**
 * get list
 * */
router.get('/get-user-plan-list', auth(), UserPlanController.list);
module.exports = router;
