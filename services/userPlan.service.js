import { User, UserPlan } from 'models';

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
    .populate('userId', 'name email userUniqueId');
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

export async function getUserPlanListByAppUsesType(appUsesType, options = {}) {
  // 1. Set up pagination parameters
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  // First, find the IDs of users that match the appUsesType
  const userFilter = appUsesType && appUsesType !== 'all' ? { appUsesType } : {};
  const matchingUserIds = await User.find(userFilter, '_id').lean();
  const userIds = matchingUserIds.map((user) => user._id);

  // Now, create the main query for UserPlan using the matched user IDs
  const query = { userId: { $in: userIds } };

  // 3. Execute queries for data and total count concurrently
  const [results, totalResults] = await Promise.all([
    UserPlan.find(query)
      .populate('planId')
      .populate({
        path: 'userId',
        select: 'name email appUsesType userUniqueId',
      })
      .sort({ createdAt: -1 }) // Optional: add sorting
      .skip(skip)
      .limit(limit)
      .lean(), // Use .lean() for faster read-only operations
    UserPlan.countDocuments(query),
  ]);

  // 4. Calculate total pages
  const totalPages = Math.ceil(totalResults / limit);

  // 5. Return the complete pagination object
  return {
    results,
    page,
    limit,
    totalPages,
    totalResults,
  };
}

export async function getTotalRevenueByAppUsesType(appUsesType) {
  // Step 1: Filter users by appUsesType (if not 'all')
  const userFilter = appUsesType && appUsesType !== 'all' ? { appUsesType } : {};
  const matchingUserIds = await User.find(userFilter, '_id').lean();
  const userIds = matchingUserIds.map((user) => user._id);

  // Step 2: Find all active user plans for those users and populate planId
  const userPlans = await UserPlan.find({ userId: { $in: userIds }, status: 'active' })
    .populate('planId', 'totalPrice')
    .lean();

  // Step 3: Calculate total revenue
  const totalRevenueGenerated = userPlans.reduce((sum, plan) => {
    const price = plan.planId.totalPrice || 0;
    return sum + price;
  }, 0);

  return totalRevenueGenerated;
}
