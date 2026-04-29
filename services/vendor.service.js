import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { Role, User } from '../models';
import ApiError from '../utils/ApiError';

export async function getvendorUserList(filter, options = {}, loggedInUserId = null) {
  const { page = 1, limit = 10, search } = options;

  const skip = (page - 1) * limit;
  if (loggedInUserId) {
    // eslint-disable-next-line no-param-reassign
    filter._id = { $ne: new mongoose.Types.ObjectId(loggedInUserId) };
  }
  // 🔹 Exclude admin roles
  const excludedRoles = await Role.find(
    { role: { $in: ['project-owner', 'super-admin', 'admin', 'co-admin'] } },
    '_id'
  ).lean();

  const excludedRoleIds = excludedRoles.map((r) => r._id);

  // eslint-disable-next-line no-param-reassign
  filter['profileHideAndDelete.isProfileHide'] = { $ne: true };
  // eslint-disable-next-line no-param-reassign
  filter.role = { $nin: excludedRoleIds };

  // 🔍 SEARCH
  if (search) {
    const regex = { $regex: search, $options: 'i' };
    // eslint-disable-next-line no-param-reassign
    filter.$or = [{ name: regex }, { email: regex }, { 'vendorData.businessName': regex }];
  }

  // 🔥 AGGREGATION START
  const pipeline = [
    { $match: filter },

    // 🔗 Address
    {
      $lookup: {
        from: 'Address',
        localField: 'address',
        foreignField: '_id',
        as: 'address',
      },
    },
    { $unwind: { path: '$address', preserveNullAndEmptyArrays: true } },

    // 🔍 SEARCH on address
    ...(search
      ? [
          {
            $match: {
              $or: [
                { 'address.currentCity': { $regex: search, $options: 'i' } },
                { 'address.area': { $regex: search, $options: 'i' } },
              ],
            },
          },
        ]
      : []),

    // 🔥 SORT latest first
    { $sort: { createdAt: -1 } },

    // 🔥 SHORTLIST JOIN (if logged in)
    ...(loggedInUserId
      ? [
          {
            $lookup: {
              from: 'shortlists',
              let: { vendorId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$shortlistId', '$$vendorId'] },
                        { $eq: ['$userId', new mongoose.Types.ObjectId(loggedInUserId)] },
                      ],
                    },
                  },
                },
              ],
              as: 'shortlistData',
            },
          },
          {
            $addFields: {
              isShortlisted: {
                $cond: [{ $gt: [{ $size: '$shortlistData' }, 0] }, true, false],
              },
            },
          },
        ]
      : [
          {
            $addFields: {
              isShortlisted: false,
            },
          },
        ]),

    // 🔥 CLEAN RESPONSE
    {
      $project: {
        name: 1,
        email: 1,
        profilePic: 1,
        userProfilePic: 1,
        vendorData: 1,
        address: 1,
        isShortlisted: 1,
        shortlistData: 1,
        createdAt: 1,
      },
    },

    // 🔥 PAGINATION
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: 'total' }],
      },
    },
  ];

  const result = await User.aggregate(pipeline);

  const docs = result[0].data;
  const totalDocs = result[0].totalCount.length ? result[0].totalCount[0].total : 0;

  return {
    results: docs,
    pagination: {
      totalDocs,
      limit,
      page,
      totalPages: Math.ceil(totalDocs / limit),
    },
  };
}

export async function getvendorUserListSearch(filter, options = {}, loggedInUserId = null) {
  const { page = 1, limit = 10, search, businessType, service, city, area } = options;

  const skip = (page - 1) * limit;

  if (loggedInUserId) {
    // eslint-disable-next-line no-param-reassign
    filter._id = { $ne: new mongoose.Types.ObjectId(loggedInUserId) };
  }

  const excludedRoles = await Role.find(
    { role: { $in: ['project-owner', 'super-admin', 'admin', 'co-admin'] } },
    '_id'
  ).lean();

  const excludedRoleIds = excludedRoles.map((r) => r._id);
  // eslint-disable-next-line no-param-reassign
  filter['profileHideAndDelete.isProfileHide'] = { $ne: true };
  // eslint-disable-next-line no-param-reassign
  filter.role = { $nin: excludedRoleIds };

  if (search) {
    const regex = { $regex: search, $options: 'i' };
    // eslint-disable-next-line no-param-reassign
    filter.$or = [{ name: regex }, { email: regex }, { 'vendorData.businessName': regex }];
  }

  const normalizedBusinessType = businessType ? businessType.replace(/_/g, '-') : null;

  // 🔥 Convert city & area to arrays
  let cityArray = [];
  if (city) {
    cityArray = Array.isArray(city) ? city : city.split(',').map((c) => c.trim());
  }

  let areaArray = [];
  if (area) {
    areaArray = Array.isArray(area) ? area : area.split(',').map((a) => a.trim());
  }

  const pipeline = [
    { $match: filter },

    // 🔥 unwind vendorData
    { $unwind: '$vendorData' },

    // 🔥 BUSINESS TYPE + SERVICE FILTER
    {
      $match: {
        ...(normalizedBusinessType && {
          $or: [
            { 'vendorData.businessType': normalizedBusinessType },
            { 'vendorData.businessType': normalizedBusinessType.replace(/-/g, '_') },
          ],
        }),
        ...(service && {
          'vendorData.servicesProvided': service,
        }),
      },
    },

    // 🔗 ADDRESS JOIN
    {
      $lookup: {
        from: 'Address',
        localField: 'address',
        foreignField: '_id',
        as: 'address',
      },
    },
    { $unwind: { path: '$address', preserveNullAndEmptyArrays: true } },

    // 🔥 CITY + AREA FILTER (MULTI SUPPORT)
    ...(cityArray.length || areaArray.length
      ? [
          {
            $match: {
              $and: [
                ...(cityArray.length
                  ? [
                      {
                        $or: cityArray.map((c) => ({
                          'address.currentCity': { $regex: c, $options: 'i' },
                        })),
                      },
                    ]
                  : []),
                ...(areaArray.length
                  ? [
                      {
                        $or: areaArray.map((a) => ({
                          'address.area': { $regex: a, $options: 'i' },
                        })),
                      },
                    ]
                  : []),
              ],
            },
          },
        ]
      : []),

    { $sort: { createdAt: -1 } },

    // 🔥 SHORTLIST JOIN
    ...(loggedInUserId
      ? [
          {
            $lookup: {
              from: 'shortlists',
              let: { vendorId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$shortlistId', '$$vendorId'] },
                        { $eq: ['$userId', new mongoose.Types.ObjectId(loggedInUserId)] },
                      ],
                    },
                  },
                },
              ],
              as: 'shortlistData',
            },
          },
          {
            $addFields: {
              isShortlisted: { $gt: [{ $size: '$shortlistData' }, 0] },
            },
          },
        ]
      : [
          {
            $addFields: {
              isShortlisted: false,
            },
          },
        ]),

    // 🔁 GROUP BACK
    {
      $group: {
        _id: '$_id',
        name: { $first: '$name' },
        email: { $first: '$email' },
        profilePic: { $first: '$profilePic' },
        userProfilePic: { $first: '$userProfilePic' },
        address: { $first: '$address' },
        createdAt: { $first: '$createdAt' },
        vendorData: { $push: '$vendorData' },
        isShortlisted: { $first: '$isShortlisted' },
        shortlistData: { $first: '$shortlistData' },
      },
    },

    // 🔥 PAGINATION
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: 'total' }],
      },
    },
  ];

  const result = await User.aggregate(pipeline);

  const docs = result[0].data;
  const totalDocs = result[0].totalCount.length ? result[0].totalCount[0].total : 0;

  return {
    results: docs,
    pagination: {
      totalDocs,
      limit,
      page,
      totalPages: Math.ceil(totalDocs / limit),
    },
  };
}

export async function getVendorAreasList(filter, options = {}, loggedInUserId = null) {
  const { search, businessType, service, city } = options;

  if (loggedInUserId) {
    // eslint-disable-next-line no-param-reassign
    filter._id = { $ne: new mongoose.Types.ObjectId(loggedInUserId) };
  }

  const excludedRoles = await Role.find(
    { role: { $in: ['project-owner', 'super-admin', 'admin', 'co-admin'] } },
    '_id'
  ).lean();

  const excludedRoleIds = excludedRoles.map((r) => r._id);

  // eslint-disable-next-line no-param-reassign
  filter['profileHideAndDelete.isProfileHide'] = { $ne: true };
  // eslint-disable-next-line no-param-reassign
  filter.role = { $nin: excludedRoleIds };

  if (search) {
    const regex = { $regex: search, $options: 'i' };
    // eslint-disable-next-line no-param-reassign
    filter.$or = [{ name: regex }, { email: regex }, { 'vendorData.businessName': regex }];
  }

  const normalizedBusinessType = businessType ? businessType.replace(/_/g, '-') : null;

  const pipeline = [
    { $match: filter },

    { $unwind: '$vendorData' },

    {
      $match: {
        ...(normalizedBusinessType && {
          $or: [
            { 'vendorData.businessType': normalizedBusinessType },
            { 'vendorData.businessType': normalizedBusinessType.replace(/-/g, '_') },
          ],
        }),

        ...(service && {
          'vendorData.servicesProvided': service,
        }),
      },
    },

    // 🔗 ADDRESS JOIN
    {
      $lookup: {
        from: 'Address',
        localField: 'address',
        foreignField: '_id',
        as: 'address',
      },
    },
    { $unwind: { path: '$address', preserveNullAndEmptyArrays: true } },

    // 🔥 CITY FILTER
    {
      $match: {
        ...(city && {
          'address.currentCity': { $regex: city, $options: 'i' },
        }),
      },
    },

    // ✅ ONLY AREA FIELD
    {
      $group: {
        _id: '$address.area',
      },
    },

    // ❌ remove null / empty
    {
      $match: {
        _id: { $nin: [null, ''] },
      },
    },

    // 🔄 rename field
    {
      $project: {
        _id: 0,
        area: '$_id',
      },
    },

    // 🔽 sort areas
    {
      $sort: { area: 1 },
    },
  ];

  const result = await User.aggregate(pipeline);

  return result; // only area list
}

export async function getVendorWithShortlist(userId, loggedInUserId = null) {
  const objectUserId = new mongoose.Types.ObjectId(userId);

  const pipeline = [
    {
      $match: {
        _id: objectUserId,
        'profileHideAndDelete.isProfileHide': { $ne: true },
      },
    },

    // 🔗 ADDRESS
    {
      $lookup: {
        from: 'Address',
        localField: 'address',
        foreignField: '_id',
        as: 'address',
      },
    },
    { $unwind: { path: '$address', preserveNullAndEmptyArrays: true } },

    // 🔥 SHORTLIST FIX (FINAL)
    ...(loggedInUserId
      ? [
          {
            $lookup: {
              from: 'shortlists',
              let: { vendorId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: [{ $toString: '$shortlistId' }, { $toString: '$$vendorId' }],
                        },
                        {
                          $eq: [{ $toString: '$userId' }, loggedInUserId.toString()],
                        },
                      ],
                    },
                  },
                },
              ],
              as: 'shortlistData',
            },
          },
          {
            $addFields: {
              isShortlisted: {
                $gt: [{ $size: '$shortlistData' }, 0],
              },
            },
          },
        ]
      : [
          {
            $addFields: {
              isShortlisted: false,
              shortlistData: [],
            },
          },
        ]),

    {
      $project: {
        name: 1,
        email: 1,
        profilePic: 1,
        userProfilePic: 1,
        vendorData: 1,
        address: 1,
        isShortlisted: 1,
        shortlistData: 1,
        createdAt: 1,
      },
    },
  ];

  const result = await User.aggregate(pipeline);

  if (!result.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Vendor not found');
  }

  return {
    user: result[0],
  };
}

export async function getSameCityVendorList(userId) {
  // 1. Get logged-in user with address
  const loginUser = await User.findById(userId).populate('address').lean();

  if (!loginUser || !loginUser.address) {
    throw new Error('User address not found');
  }

  const { currentCity } = loginUser.address;

  // 2. Normalize city (avoid regex crash if null/undefined)
  const cityRegex = currentCity ? new RegExp(`^${currentCity}$`, 'i') : null;

  // 3. Get excluded roles
  const excludedRoles = await Role.find(
    { role: { $in: ['project-owner', 'super-admin', 'admin', 'co-admin'] } },
    '_id'
  ).lean();

  const excludedRoleIds = excludedRoles.map((r) => r._id);

  // 4. Find same city vendors
  const vendors = await User.find({
    appUsesType: 'vendor',
    role: { $nin: excludedRoleIds },
    'profileHideAndDelete.isProfileHide': { $ne: true },
  })
    .populate({
      path: 'address',
      match: cityRegex
        ? { currentCity: { $regex: cityRegex } } // ✅ case-insensitive match
        : {},
    })
    .populate('userProfessional')
    .populate('userEducation')
    .populate('role', 'role')
    .lean();

  // 5. Filter only matched address
  const filteredVendors = vendors.filter((v) => v.address);

  return filteredVendors;
}
