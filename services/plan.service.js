import { Plan } from '../models';

export async function createPlan(body = {}) {
  const plan = await Plan.create(body);
  return plan;
}

export async function getPlanList(filter, options = {}) {
  const plan = await Plan.find(filter, options.projection, options);
  return plan;
}

export async function getPlanById(planId, options = {}) {
  const plan = await Plan.findById(planId, options);
  return plan;
}

export async function updatePlan(filter, body, options = {}) {
  const plan = await Plan.findOneAndUpdate(filter, body, options);
  return plan;
}

export async function getPlan(filter, options = {}) {
  const plan = await Plan.findOne(filter, options.projection, options);
  return plan;
}

export async function removeplan(filter) {
  const plan = await Plan.findOneAndRemove(filter);
  return plan;
}
