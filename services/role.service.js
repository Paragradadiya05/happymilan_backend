import { Role } from '../models';

export async function createRole(body = {}) {
  const role = await Role.create(body);
  return role;
}

export async function getRoleList(filter, options = {}) {
  const role = await Role.find(filter, options.projection, options);
  return role;
}

export async function getOneRole(filter, options = {}) {
  return Role.findOne(filter, options.projection, options);
}

export async function updateRole(filter, body, options = {}) {
  const role = await Role.findOneAndUpdate(filter, body, options);
  return role;
}

export async function deleteRole(filter, body, options = {}) {
  const role = await Role.findOneAndDelete(filter.body, options);
  return role;
}
