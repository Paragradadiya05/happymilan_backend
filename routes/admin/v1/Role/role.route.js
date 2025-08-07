import express from 'express';
import { roleValidation } from 'validations/admin';
import { roleController } from 'controllers/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';
import { EnumRoleOfUser } from '../../../../models/enum.model';

const router = express.Router();
/**
 * create role
 * */
router.post('/create-role', auth([EnumRoleOfUser.SUPER_ADMIN]), validate(roleValidation.addRole), roleController.add);
/**
 * get role for create role
 * */
router.get(
  '/get-role-v2',
  auth([EnumRoleOfUser.ADMIN, EnumRoleOfUser.SUPER_ADMIN, EnumRoleOfUser.CO_ADMIN]),
  roleController.listv2
);
/**
 * get role
 * */
router.get(
  '/get-role',
  auth([EnumRoleOfUser.ADMIN, EnumRoleOfUser.SUPER_ADMIN, EnumRoleOfUser.CO_ADMIN]),
  roleController.list
);
/**
 * update role
 * */
router.put(
  '/update-role/:roleId',
  auth([EnumRoleOfUser.SUPER_ADMIN, EnumRoleOfUser.ADMIN]),
  validate(roleValidation.updatePlan),
  roleController.update
);
/**
 * delete role
 * */
router.delete(
  '/delete-role/:roleId',
  auth([EnumRoleOfUser.SUPER_ADMIN]),
  validate(roleValidation.deleteRole),
  roleController.Delete
);

export default router;
