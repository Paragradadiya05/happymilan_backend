import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { roleservice } from '../../services';

export const add = catchAsync(async (req, res) => {
  const options = {};
  const role = await roleservice.createRole(req.body, options);
  return res.status(httpStatus.OK).send({ results: role });
});

export const list = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const role = await roleservice.getRoleList(filter, options);
  return res.status(httpStatus.OK).send({ results: role });
});
export const update = catchAsync(async (req, res) => {
  const { body } = req;
  body.updatedBy = req.admin;
  const { roleId } = req.params;
  const filter = {
    _id: roleId,
  };
  const options = { new: true };
  const role = await roleservice.updateRole(filter, body, options);
  return res.status(httpStatus.OK).send({ results: role });
});

export const Delete = catchAsync(async (req, res) => {
  const { body } = req;
  const { roleId } = req.params;
  const filter = {
    _id: roleId,
  };
  const options = {};
  const role = await roleservice.deleteRole(filter, body, options);
  return res.status(httpStatus.OK).send({ results: role });
});
