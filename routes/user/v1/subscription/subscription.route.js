import express from 'express';
import { SubscriptionController } from 'controllers/user';
import auth from 'middlewares/auth';

const router = express();
/**
 * getByUserId
 * */
router.get('/get-user-subscription', auth(), SubscriptionController.getUserSubscription);

module.exports = router;
