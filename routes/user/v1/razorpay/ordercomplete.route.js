import express from 'express';
import { completeController } from 'controllers/user';
import auth from 'middlewares/auth';
import validate from 'middlewares/validate';
import { orderValidation } from 'validations/user';

const router = express();

// todo : add validation for query
router.post('/is-order-complete', auth(), validate(orderValidation.orderComplete), completeController.complete);

router.post('/order', auth(), validate(orderValidation.createOrder), completeController.createOrder);

module.exports = router;
