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
  const test = await UserPlan.find(filter, options.projection, options)
    .populate('planId')
    .populate('userId', 'name email appUsesType userUniqueId');
  return test;
}

export async function getUserPlanListWithPagination(filter, options = {}, appUsesType) {
  const queryOptions = {
    ...options,
    populate: [
      { path: 'planId' },
      {
        path: 'userId',
        select: 'name email appUsesType userUniqueId',
        match: appUsesType && appUsesType !== 'all' ? { appUsesType } : {},
      },
    ],
  };

  const result = await UserPlan.paginate(filter, queryOptions);

  // 🔥 Remove docs where userId = null
  if (Array.isArray(result.docs)) {
    result.docs = result.docs.filter((doc) => doc.userId !== null);
    // also fix totalDocs & totalPages
    result.totalDocs = result.docs.length;
    result.totalPages = Math.ceil(result.totalDocs / (result.limit || 10));
  }

  return result;
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
