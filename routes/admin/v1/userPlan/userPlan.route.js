import express from 'express';
import { UserPlanController } from 'controllers/admin';
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
/**
 * get receipt
 * */
router.get('/receipt', auth(), UserPlanController.downloadUserPlanReceipt);
module.exports = router;
