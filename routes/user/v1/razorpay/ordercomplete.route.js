import express from 'express';
import { completeController } from 'controllers/user';
// import auth from 'middlewares/auth';
import validate from 'middlewares/validate';
import { orderValidation } from 'validations/user';

const router = express();

router.post('/is-order-complete', completeController.complete);

router.post(
  '/order',
  // auth(),
  validate(orderValidation.createOrder),
  completeController.createOrder
);

module.exports = router;
