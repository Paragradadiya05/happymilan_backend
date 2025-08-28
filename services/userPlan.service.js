import { UserPlan } from 'models';

export async function getUserPlanById(id, options = {}) {
  const test = await UserPlan.findById(id, options.projection, options);
  return test;
}

export async function getOne(query, options = {}) {
  const test = await UserPlan.findOne(query, options.projection, {
    ...options,
    sort: { createdAt: -1 }, // Get the latest by createdAt
  })
    .populate('planId')
    .populate('userId', 'name email');
  return test;
}

export async function getUserPlanList(filter, options = {}) {
  const test = await UserPlan.find(filter, options.projection, options);
  return test;
}

export async function getUserPlanListWithPagination(filter, options = {}) {
  const test = await UserPlan.paginate(filter, options);
  return test;
}

export async function createUserPlan(body = {}) {
  const test = await UserPlan.create(body);
  return test;
}

export async function updateUserPlan(filter, body, options = {}) {
  const test = await UserPlan.findOneAndUpdate(filter, body, options);
  return test;
}

export async function updateManyUserPlan(filter, body, options = {}) {
  const test = await UserPlan.updateMany(filter, body, options);
  return test;
}

export async function removeUserPlan(filter) {
  const test = await UserPlan.findOneAndRemove(filter);
  return test;
}

export async function removeManyUserPlan(filter) {
  const test = await UserPlan.deleteMany(filter);
  return test;
}
