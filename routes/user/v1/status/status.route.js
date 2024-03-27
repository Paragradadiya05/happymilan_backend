import express from 'express';
import { statusValidation } from 'validations/user';
import { statusController } from 'controllers/user';
import validate from 'middlewares/validate';
import auth from '../../../../middlewares/auth';

const router = express.Router();
/**
 * create status
 * */
router.post('/create-status', auth(), validate(statusValidation.createStatus), statusController.create);
/**
 * get status
 * */
router.get('/get-status', auth(), validate(statusValidation.getStatus), statusController.list);

export default router;
