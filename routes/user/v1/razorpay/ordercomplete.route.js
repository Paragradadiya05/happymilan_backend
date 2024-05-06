import express from 'express';
import { completeController } from 'controllers/user';

const router = express();

router.post('/is-order-complete', completeController.complete);

router.post('/order', completeController.createOrder);

module.exports = router;
