import express from 'express';
import { roleValidation } from 'validations/admin';
import { roleController } from 'controllers/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
/**
 * create role
 * */
router.post('/create-role', auth('admin'), validate(roleValidation.addRole), roleController.add);
/**
 * get role
 * */
router.get('/get-role', auth('admin'), roleController.list);
/**
 * update role
 * */
router.put('/update-role/:roleId', auth('admin'), validate(roleValidation.updatePlan), roleController.update);
/**
 * delete role
 * */
router.delete('/delete-role/:roleId', auth('admin'), validate(roleValidation.deleteRole), roleController.Delete);

export default router;
