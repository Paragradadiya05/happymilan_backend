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
 * update status
 * */
router.put('/update-status/:statusId', auth(), validate(statusValidation.updateStatus), statusController.update);
/**
 * get status
 * */
router.get('/get-status', auth(), validate(statusValidation.getStatus), statusController.list);
/**
 * get all status
 * */
router.get('/get-all-status', auth(), validate(statusValidation.getStatus), statusController.allList);
/**
 * delete status ById
 * */
router.delete('/delete-status/:statusId', validate(statusValidation.deleteStatusById), statusController.remove);
export default router;
