import express from 'express';
import { completeController } from 'controllers/user';

const router = express();

router.post('/is-order-complete', completeController.complete);

module.exports = router;
