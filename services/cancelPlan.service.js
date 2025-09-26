import { cancelPlan } from 'models'; // assuming you export models centrally

export async function createCancelPlan(body = {}) {
  const CancelPlan = await cancelPlan.create(body);
  return CancelPlan;
}

export async function updateCancelPlan(filter, body, options = {}) {
  const CancelPlan = await cancelPlan.findOneAndUpdate(filter, body, { new: true, ...options });
  return CancelPlan;
}

export async function removeCancelPlan(filter) {
  const CancelPlan = await cancelPlan.findOneAndRemove(filter);
  return CancelPlan;
}

export async function getCancelPlanList(filter, options = {}) {
  const CancelPlans = await cancelPlan.find(filter, options.projection, options).populate('userPlanId').populate('planId');
  return CancelPlans;
}

export async function getOneCancelPlan(query, options = {}) {
  const CancelPlan = await cancelPlan.findOne(query, options.projection, options).populate('userPlanId').populate('planId');
  return CancelPlan;
}

export async function getCancelPlanPaginete(filter, options = {}) {
  const CancelPlans = await cancelPlan.paginate(filter, options);
  return CancelPlans;
}
