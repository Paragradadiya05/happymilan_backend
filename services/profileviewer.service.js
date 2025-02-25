import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { ProfileView, User, Notification, Partner } from '../models';
import ApiError from '../utils/ApiError';
import { EnumOfPrivacySetting, EnumOfUserPlan, EnumStatusOfFriend } from '../models/enum.model';
import { userPlanService } from './index';

const createDynamicProjectionForPrivacySetting = (fields, defaultFields, isPremiumUser = false) => {
  const projection = {
    _id: 1,
    matchPercentage: '$matchData.matchPercentage',
    matchedCriteria: '$matchData.matchedCriteria',
    matchedFields: '$matchData.matchedFields',
    'userLikeDetails.isLike': 1,
    'userLikeDetails.user': { $getField: { field: 'user', input: '$userLikeDetails' } },
    'userLikeDetails.likedUserId': { $getField: { field: 'likedUserId', input: '$userLikeDetails' } },
    'userLikeDetails._id': { $getField: { field: '_id', input: '$userLikeDetails' } },
    'userShortListDetails.userId': 1,
    'userShortListDetails.shortlistId': { $getField: { field: 'shortlistId', input: '$userShortListDetails' } },
    'userShortListDetails._id': { $getField: { field: '_id', input: '$userShortListDetails' } },
    'subscriptionDetails.status': { $getField: { field: 'status', input: '$subscriptionDetails' } },
    'friendsDetails.status': { $getField: { field: 'status', input: '$friendsDetails' } },
    'friendsDetails._id': { $getField: { field: '_id', input: '$friendsDetails' } },
  };

  // Add default fields if privacySetting is 'default'
  projection.defaultFields = {
    $cond: {
      if: { $eq: ['$privacySetting', 'default'] },
      then: defaultFields,
      else: {},
    },
  };

  // Add individual field conditions with an additional check for premium user
  fields.forEach(({ name }) => {
    // console.log('$privacySettingCustom.publicProfile === ', `$privacySettingCustom.publicProfile`);
    projection[name] = {
      $cond: {
        if: {
          $or: [
            // Check if the field is in `publicProfile`
            {
              $and: [
                { $eq: ['$privacySetting', EnumOfPrivacySetting.PUBLIC_PROFILE] },
                { $in: [name, { $ifNull: ['$privacySettingCustom.publicProfile', []] }] },
              ],
            },
            // Check if the field is in `privateProfile` and the user is private
            {
              $and: [
                { $eq: ['$privacySetting', EnumOfPrivacySetting.PRIVATE_PROFILE] },

                {
                  $in: [
                    name,
                    {
                      $ifNull: ['$privacySettingCustom.privateProfile', []],
                    },
                  ],
                },
              ],
            },
            // Check if the field is in `premiumProfile` and the user is premium
            {
              $and: [
                { $eq: ['$privacySetting', EnumOfPrivacySetting.PREMIUM_PROFILE] },
                { $in: [name, { $ifNull: ['$privacySettingCustom.premiumProfile', []] }] },
                { $literal: isPremiumUser },
              ],
            },

            // // Check for `OnlyAcceptedMembers` and friend status
            // {
            //   $and: [
            //     { $eq: ['$privacySetting', 'OnlyAcceptedMembers'] },
            //     { $eq: ['$friendsDetails.status', 'ACCEPTED'] }, // EnumStatusOfFriend.ACCEPTED
            //   ],
            // },
            // // // Fallback to `privateProfile` if friend status is not ACCEPTED
            // {
            //   $and: [
            //     { $eq: ['$privacySetting', 'OnlyAcceptedMembers'] },
            //     { $ne: ['$friendsDetails.status', 'ACCEPTED'] },
            //     { $in: ['privateProfile', conditions] },
            //   ],
            // },
          ],
        },
        then: `$${name}`,
        else: null,
      },
    };
  });

  return projection;
};
export async function createprofileviewer(body = {}, user, appUsesType) {
  const userId = user._id;
  const { viewerId } = body;

  const viewer = await User.findOne({ _id: viewerId, appUsesType });
  console.log('=====xx====>', viewer);
  if (!viewer) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No such user exists');
  }

  let existingProfileView = await ProfileView.findOne({ user: userId, viewerId });

  if (existingProfileView) {
    existingProfileView.lastViewTime = Date.now();

    if (!existingProfileView.recentViews) {
      existingProfileView.recentViews = [];
    }
    existingProfileView.recentViews.push({ recentView: Date.now() });

    existingProfileView = await existingProfileView.save();

    return existingProfileView;
  }
  await Notification.create({ userId, otherUserId: body.viewerId, body: 'view your profile' });
  return ProfileView.create({
    user: userId,
    viewerId: body.viewerId,
    createdBy: user,
    updatedBy: user,
    recentViews: [{ recentView: Date.now() }],
    lastViewTime: Date.now(),
  });
}
export async function getProfileViewer(filter, options = {}) {
  const user = await ProfileView.find(filter, options.projection, options)
    .populate({
      path: 'user',
      populate: [{ path: 'address' }, { path: 'userProfessional' }],
    })
    .populate({
      path: 'viewerId',
      populate: [{ path: 'address' }, { path: 'userProfessional' }],
    });
  return user;
}

// export async function getProfileViewertWithPagination(filter, options = {}) {
//   const user = await ProfileView.paginate(filter, options);
//   return user;
// }

export async function getProfileViewertWithPagination(filter, options = {}) {
  const userPartnerPreferences = await Partner.findOne({ userId: filter.userId });
  if (!userPartnerPreferences) {
    throw new Error('User Partner Preferences not found. Please add Partner Preference first');
  }
  let { limit = 10, page = 1 } = options;

  // Ensure limit and page are integers
  limit = parseInt(limit, 10);
  page = parseInt(page, 10);

  // Ensure limit and page are positive numbers
  // eslint-disable-next-line no-restricted-globals
  if (isNaN(limit) || limit <= 0) {
    limit = 10; // default value if the provided limit is invalid
  }

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(page) || page <= 0) {
    page = 1; // default value if the provided page is invalid
  }

  const skip = (page - 1) * limit;
  const currentDate = new Date();
  const getUserPlanDetails = await userPlanService.getOne(
    {
      userId: filter.userId,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    },
    {}
  );
  let isPremiumUser = false;
  if (getUserPlanDetails && getUserPlanDetails.status) isPremiumUser = getUserPlanDetails.status === EnumOfUserPlan.ACTIVE;
  console.log('=====isPremiumUser====>', isPremiumUser);
  // Define fields and their privacy conditions
  const fields = [
    // user profile photo
    { name: 'profilePic' },
    { name: 'userProfilePic' },
    { name: 'userProfileVideo' },
    // general details
    { name: 'firstName' },
    { name: 'lastName' },
    { name: 'dateOfBirth' },
    { name: 'birthTime' },
    { name: 'religion' },
    { name: 'caste' },
    { name: 'height' },
    { name: 'weight' },
    { name: 'displayName' },
    { name: 'name' },
    { name: 'randomId' },
    { name: 'maritalStatus' },

    // contact details this will be hidden for all
    // { name: 'email', conditions: ['default', EnumOfPrivacySetting.PUBLIC_PROFILE] },
    // { name: 'mobileNumber', conditions: ['default', EnumOfPrivacySetting.PUBLIC_PROFILE] },

    // education details
    { name: 'userEducation' },

    // Professional Details
    { name: 'userProfessional' },
    { name: 'hobbies' },
    { name: 'userPartnerDetails' },
  ];
  console.log('=====fields====>', fields);
  // Define additional fields for `privacySetting: 'default'`
  const defaultFields = {
    age: '$age',
    height: '$height',
    address: {
      _id: { $getField: { field: '_id', input: '$address' } },
      currentResidenceAddress: { $getField: { field: 'currentResidenceAddress', input: '$address' } },
      currentCity: { $getField: { field: 'currentCity', input: '$address' } },
      state: { $getField: { field: 'state', input: '$address' } },
      currentCountry: { $getField: { field: 'currentCountry', input: '$address' } },
      createdAt: { $getField: { field: 'createdAt', input: '$address' } },
      updatedAt: { $getField: { field: 'updatedAt', input: '$address' } },
    },
    appUsesType: '$appUsesType',
    emailVerified: '$emailVerified',
    maritalStatus: '$maritalStatus',
    gender: '$gender',
    // dateOfBirth: '$dateOfBirth',
    // birthTime: '$birthTime',
    // religion: '$religion',
    // caste: '$caste',
    hobbies: '$hobbies',
    interest: '$interest',
    // homeMobileNumber: '$homeMobileNumber',
    // creatingProfileFor: '$creatingProfileFor',
    writeBoutYourSelf: '$writeBoutYourSelf',
    community: '$community',
    motherTongue: '$motherTongue',
    weight: '$weight',
    // userEducation: '$userEducation',
    // userProfessional: {
    //   _id: { $getField: { field: '_id', input: '$userProfessional' } },
    //   jobTitle: { $getField: { field: 'jobTitle', input: '$userProfessional' } },
    //   jobType: { $getField: { field: 'jobType', input: '$userProfessional' } },
    //   companyName: { $getField: { field: 'companyName', input: '$userProfessional' } },
    //   currentSalary: { $getField: { field: 'currentSalary', input: '$userProfessional' } },
    //   workCity: { $getField: { field: 'workCity', input: '$userProfessional' } },
    //   workCountry: { $getField: { field: 'workCountry', input: '$userProfessional' } },
    // },
    userUniqueId: '$userUniqueId',
  };
  console.log('=====defaultFields====>', defaultFields);
  const pipeline = [
    {
      $match: {
        user: mongoose.Types.ObjectId(filter.userId), // find the current user
      },
    },
    {
      $lookup: {
        from: 'User',
        localField: 'viewerId',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true, // Include users with no matching friends
      },
    },
    // {
    //   $lookup: {
    //     from: 'Subscription', // Ensure this matches the subscription collection name
    //     let: { userId: '$_id' }, // Reference the current user's ID
    //     pipeline: [
    //       {
    //         $match: {
    //           $expr: {
    //             $eq: ['$user', '$$userId'], // Match the user ID
    //           },
    //         },
    //       },
    //     ],
    //     as: 'subscriptionDetails',
    //   },
    // },
    // {
    //   $unwind: {
    //     path: '$subscriptionDetails',
    //     preserveNullAndEmptyArrays: true, // Include users even if they don't have any subscriptions
    //   },
    // },
    {
      $lookup: {
        from: 'likes', // Collection name for likes
        let: { viewerIdUserId: '$viewerId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$user', mongoose.Types.ObjectId(filter.userId)] }, // Logged-in user's ID
                  { $eq: ['$likedUserId', '$$viewerIdUserId'] }, // Liked user ID matches shortlistId
                ],
              },
            },
          },
        ],
        as: 'userLikeDetails',
      },
    },
    {
      $unwind: {
        path: '$userLikeDetails',
        preserveNullAndEmptyArrays: true, // Include data even if there are no likes
      },
    },
    {
      $lookup: {
        from: 'shortlists',
        let: { currentUserIdForShortList: '$viewerId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$userId', mongoose.Types.ObjectId(filter.userId)] },
                  { $eq: ['$shortlistId', '$$currentUserIdForShortList'] },
                ],
              },
            },
          },
        ],
        as: 'shortlistData',
      },
    },
    {
      $unwind: {
        path: '$shortlistData', // Deconstructs the 'address' array field
        preserveNullAndEmptyArrays: true, // If you want to exclude documents with no address
      },
    },
    {
      $lookup: {
        from: 'Friend', // Collection name for friends
        let: { viewerIdUserId: '$viewerId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$user', mongoose.Types.ObjectId(filter.userId)] }, // Logged-in user's ID
                  { $eq: ['$friend', '$$viewerIdUserId'] }, // Friend ID matches
                ],
              },
            },
          },
        ],
        as: 'friendsDetails',
      },
    },
    {
      $unwind: {
        path: '$friendsDetails',
        preserveNullAndEmptyArrays: true, // Include data even if there are no friend details
      },
    },
    {
      $match: {
        'friendsDetails.status': { $ne: EnumStatusOfFriend.BLOCKED },
      },
    },
    {
      $addFields: {
        age: {
          $cond: {
            if: { $and: [{ $ne: ['$user.dateOfBirth', null] }, { $ne: ['$user.dateOfBirth', ''] }] },
            then: {
              $floor: {
                $divide: [
                  { $subtract: [new Date(), '$user.dateOfBirth'] },
                  31556952000, // Average milliseconds in a year considering leap years
                ],
              },
            },
            else: null, // Handle cases where dateOfBirth is missing or invalid
          },
        },
      },
    },
    {
      $lookup: {
        from: 'Address',
        localField: 'user._id',
        foreignField: 'userId',
        as: 'address',
      },
    },
    {
      $unwind: {
        path: '$address', // Deconstructs the 'address' array field
        preserveNullAndEmptyArrays: true, // If you want to exclude documents with no address
      },
    },
    {
      $lookup: {
        from: 'UserProfessionalDetail',
        localField: 'user._id',
        foreignField: 'userId',
        as: 'userProfessional',
      },
    },
    {
      $unwind: {
        path: '$userProfessional', // Deconstructs the 'address' array field
        preserveNullAndEmptyArrays: true, // If you want to exclude documents with no address
      },
    },
    {
      $lookup: {
        from: 'UserPartner',
        localField: 'user._id', // User's `_id` field
        foreignField: 'userId', // Match with `userId` in `UserPartner`
        as: 'userPartnerDetails',
      },
    },
    {
      $unwind: {
        path: '$userPartnerDetails',
        preserveNullAndEmptyArrays: true, // Preserve if no user partner details found
      },
    },
    {
      $addFields: {
        matchData: {
          $let: {
            vars: {
              totalCriteria: 4, // Total number of criteria
              matchedCriteria: {
                $add: [
                  // Age match
                  {
                    $cond: [
                      {
                        $and: [
                          { $gte: ['$age', userPartnerPreferences.age.min] },
                          { $lte: ['$age', userPartnerPreferences.age.max] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                  // Height match
                  {
                    $cond: [
                      {
                        $and: [
                          { $gte: ['$user.height', userPartnerPreferences.height.min] },
                          { $lte: ['$user.height', userPartnerPreferences.height.max] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                  // Country match
                  {
                    $cond: [{ $in: ['$address.currentCountry', userPartnerPreferences.country] }, 1, 0],
                  },
                  // City match
                  {
                    $cond: [{ $in: ['$address.currentCity', userPartnerPreferences.city] }, 1, 0],
                  },
                ],
              },
            },
            in: {
              matchPercentage: {
                $multiply: [{ $divide: ['$$matchedCriteria', '$$totalCriteria'] }, 100],
              },
              matchedCriteria: '$$matchedCriteria',
            },
          },
        },
      },
    },
    {
      $project: createDynamicProjectionForPrivacySetting(fields, defaultFields, isPremiumUser),
    },
    { $sort: { matchPercentage: -1 } }, // Sort by match percentage in descending order
    // todo

    // { $skip: (page - 1) * limit }, // Skip documents for pagination
    // { $skip: skip },
    // { $limit: limit }, // Limit the number of documents for pagination
    // {
    //   $facet: {
    //     paginatedResults: [{ $skip: skip }, { $limit: limit }],
    //     totalCount: [{ $count: 'count' }],
    //   },
    // },
    // {
    //   $addFields: {
    //     totalDocs: { $arrayElemAt: ['$totalCount.count', 0] },
    //     totalPages: {
    //       $ceil: {
    //         $divide: [{ $arrayElemAt: ['$totalCount.count', 0] }, limit],
    //       },
    //     },
    //     currentPage: page,
    //   },
    // },

    // Facet stage: Use facet to divide the pipeline into two outputs
    // todo
    {
      $facet: {
        // Facet for paginated results
        paginatedResults: [{ $skip: skip }, { $limit: limit }],
        // Facet for counting total documents
        totalCount: [{ $count: 'count' }],
      },
    },
    // Unwind totalCount array to get the actual count value
    {
      $unwind: {
        path: '$totalCount',
        preserveNullAndEmptyArrays: true,
      },
    },
    // Add pagination details
    {
      $addFields: {
        totalDocs: { $ifNull: ['$totalCount.count', 0] },
        totalPages: {
          $ceil: {
            $divide: ['$totalCount.count', limit],
          },
        },
        currentPage: page,
      },
    },
  ];
  const matchedUsers = await ProfileView.aggregate(pipeline).exec();

  return matchedUsers;
}

export async function getProfileViewerforMobile(filter, options = {}) {
  const userPartnerPreferences = await Partner.findOne({ userId: filter.userId });

  if (!userPartnerPreferences) {
    throw new Error('User Partner Preferences not found. Please add Partner Preference first');
  }
  let { limit = 10, page = 1 } = options;

  // Ensure limit and page are integers
  limit = parseInt(limit, 10);
  page = parseInt(page, 10);

  // Ensure limit and page are positive numbers
  // eslint-disable-next-line no-restricted-globals
  if (isNaN(limit) || limit <= 0) {
    limit = 10; // default value if the provided limit is invalid
  }

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(page) || page <= 0) {
    page = 1; // default value if the provided page is invalid
  }

  const skip = (page - 1) * limit;
  const pipeline = [
    {
      $match: {
        user: mongoose.Types.ObjectId(filter.userId), // find the current user
      },
    },
    {
      $lookup: {
        from: 'User',
        localField: 'viewerId',
        foreignField: '_id',
        as: 'friendList',
      },
    },
    {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true, // Include users with no matching friends
      },
    },
    {
      $lookup: {
        from: 'User', // User collection for logged-in user's data
        localField: 'user',
        foreignField: '_id',
        as: 'userList',
      },
    },
    {
      $unwind: {
        path: '$userList',
        preserveNullAndEmptyArrays: true, // Include documents even if no logged-in user data exists
      },
    },
    {
      $lookup: {
        from: 'User',
        localField: 'viewerId',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true, // Include users with no matching friends
      },
    },
    // {
    //   $lookup: {
    //     from: 'Subscription', // Ensure this matches the subscription collection name
    //     let: { userId: '$_id' }, // Reference the current user's ID
    //     pipeline: [
    //       {
    //         $match: {
    //           $expr: {
    //             $eq: ['$user', '$$userId'], // Match the user ID
    //           },
    //         },
    //       },
    //     ],
    //     as: 'subscriptionDetails',
    //   },
    // },
    // {
    //   $unwind: {
    //     path: '$subscriptionDetails',
    //     preserveNullAndEmptyArrays: true, // Include users even if they don't have any subscriptions
    //   },
    // },
    {
      $lookup: {
        from: 'likes', // Collection name for likes
        let: { viewerIdUserId: '$viewerId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$user', mongoose.Types.ObjectId(filter.userId)] }, // Logged-in user's ID
                  { $eq: ['$likedUserId', '$$viewerIdUserId'] }, // Liked user ID matches shortlistId
                ],
              },
            },
          },
        ],
        as: 'userLikeDetails',
      },
    },
    {
      $unwind: {
        path: '$userLikeDetails',
        preserveNullAndEmptyArrays: true, // Include data even if there are no likes
      },
    },
    {
      $lookup: {
        from: 'shortlists',
        let: { currentUserIdForShortList: '$viewerId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$userId', mongoose.Types.ObjectId(filter.userId)] },
                  { $eq: ['$shortlistId', '$$currentUserIdForShortList'] },
                ],
              },
            },
          },
        ],
        as: 'shortlistData',
      },
    },
    {
      $unwind: {
        path: '$shortlistData', // Deconstructs the 'address' array field
        preserveNullAndEmptyArrays: true, // If you want to exclude documents with no address
      },
    },
    {
      $lookup: {
        from: 'Friend', // Collection name for friends
        let: { viewerIdUserId: '$viewerId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$user', mongoose.Types.ObjectId(filter.userId)] }, // Logged-in user's ID
                  { $eq: ['$friend', '$$viewerIdUserId'] }, // Friend ID matches
                ],
              },
            },
          },
        ],
        as: 'friendsDetails',
      },
    },
    {
      $unwind: {
        path: '$friendsDetails',
        preserveNullAndEmptyArrays: true, // Include data even if there are no friend details
      },
    },
    {
      $unwind: {
        path: '$friendsDetails',
        preserveNullAndEmptyArrays: true, // Include users with no matching friends
      },
    },
    {
      $match: {
        'friendsDetails.status': { $ne: EnumStatusOfFriend.BLOCKED },
      },
    },
    {
      $addFields: {
        age: {
          $cond: {
            if: { $and: [{ $ne: ['$user.dateOfBirth', null] }, { $ne: ['$user.dateOfBirth', ''] }] },
            then: {
              $floor: {
                $divide: [
                  { $subtract: [new Date(), '$user.dateOfBirth'] },
                  31556952000, // Average milliseconds in a year considering leap years
                ],
              },
            },
            else: null,
          },
        },
      },
    },
    {
      $lookup: {
        from: 'Address',
        localField: 'friendList._id',
        foreignField: 'userId',
        as: 'friendListAddress',
      },
    },
    {
      $lookup: {
        from: 'Address',
        localField: 'userList._id',
        foreignField: 'userId',
        as: 'userListAddress',
      },
    },
    {
      $lookup: {
        from: 'UserProfessionalDetail',
        localField: 'friendList._id',
        foreignField: 'userId',
        as: 'friendListProfessional',
      },
    },
    {
      $lookup: {
        from: 'UserProfessionalDetail',
        localField: 'userList._id',
        foreignField: 'userId',
        as: 'userListProfessional',
      },
    },
    {
      $lookup: {
        from: 'UserEducation', // Education collection for shortlisted users
        localField: 'friendList._id',
        foreignField: 'userId',
        as: 'friendListEducation',
      },
    },
    {
      $lookup: {
        from: 'UserEducation', // Education collection for logged-in user
        localField: 'userList._id',
        foreignField: 'userId',
        as: 'userListEducation',
      },
    },
    {
      $lookup: {
        from: 'UserPartner',
        localField: 'friendList._id',
        foreignField: 'userId',
        as: 'friendListPartner',
      },
    },
    {
      $lookup: {
        from: 'UserPartner',
        localField: 'userList._id',
        foreignField: 'userId',
        as: 'userListPartner',
      },
    },
    {
      $addFields: {
        matchData: {
          $let: {
            vars: {
              totalCriteria: 4, // Total number of criteria
              matchedCriteria: {
                $add: [
                  // Age match
                  {
                    $cond: [
                      {
                        $and: [
                          { $gte: ['$age', userPartnerPreferences.age.min] },
                          { $lte: ['$age', userPartnerPreferences.age.max] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                  // Height match
                  {
                    $cond: [
                      {
                        $and: [
                          { $gte: ['$user.height', userPartnerPreferences.height.min] },
                          { $lte: ['$user.height', userPartnerPreferences.height.max] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                  // Country match
                  {
                    $cond: [{ $in: ['$address.currentCountry', userPartnerPreferences.country] }, 1, 0],
                  },
                  // City match
                  {
                    $cond: [{ $in: ['$address.currentCity', userPartnerPreferences.city] }, 1, 0],
                  },
                ],
              },
            },
            in: {
              matchPercentage: {
                $multiply: [{ $divide: ['$$matchedCriteria', '$$totalCriteria'] }, 100],
              },
              matchedCriteria: '$$matchedCriteria',
            },
          },
        },
      },
    },
    {
      $addFields: {
        userList: {
          user: '$userList',
          address: { $arrayElemAt: ['$userListAddress', 0] },
          education: { $arrayElemAt: ['$userListEducation', 0] },
          partner: { $arrayElemAt: ['$userListPartner', 0] },
          professional: { $arrayElemAt: ['$userListProfessional', 0] },
        },
        friendList: {
          user: '$friendList',
          address: { $arrayElemAt: ['$friendListAddress', 0] },
          education: { $arrayElemAt: ['$friendListEducation', 0] },
          partner: { $arrayElemAt: ['$friendListPartner', 0] },
          professional: { $arrayElemAt: ['$friendListProfessional', 0] },
        },
      },
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        shortlistId: 1,
        createdAt: 1,
        updatedAt: 1,
        'friendsDetails.status': 1,
        'friendsDetails._id': 1,
        matchPercentage: '$matchData.matchPercentage',
        matchedCriteria: '$matchData.matchedCriteria',
        'userLikeDetails.isLike': 1,
        'userLikeDetails.user': 1,
        'userLikeDetails.likedUserId': 1,
        'userLikeDetails._id': 1,
        'userShortListDetails.userId': 1,
        'userShortListDetails.shortlistId': 1,
        'userShortListDetails._id': 1,
        'subscriptionDetails.status': 1,
        shortlistData: 1,
        userList: {
          _id: 1,
          name: 1,
          age: 1,
          appUsesType: 1,
          email: 1,
          mobileNumber: 1,
          emailVerified: 1,
          maritalStatus: 1,
          displayName: 1,
          firstName: 1,
          lastName: 1,
          gender: 1,
          dateOfBirth: 1,
          randomId: 1,
          birthTime: 1,
          religion: 1,
          caste: 1,
          hobbies: 1,
          interest: 1,
          homeMobileNumber: 1,
          creatingProfileFor: 1,
          writeBoutYourSelf: 1,
          hideProfileDuration: 1,
          community: 1,
          motherTongue: 1,
          weight: 1,
          profilePic: 1,
          isUserActive: 1,
          userUniqueId: 1,
          diet: 1,
          userProfilePic: 1,
          userProfileVideo: 1,
          profileHideAndDelete: 1,
          address: {
            _id: 1,
            currentResidenceAddress: 1,
            currentCity: 1,
            state: 1,
            currentCountry: 1,
            createdAt: 1,
            updatedAt: 1,
          },
          education: {
            _id: 1,
            userId: 1,
            degree: 1,
            collage: 1,
            city: 1,
            state: 1,
            country: 1,
          },
          partner: {
            _id: 1,
            age: 1,
            diet: 1,
            hobbies: 1,
            city: 1,
            state: 1,
            country: 1,
            income: 1,
            height: 1,
          },
          professional: {
            _id: 1,
            jobTitle: 1,
            jobType: 1,
            companyName: 1,
            currentSalary: 1,
            workCity: 1,
            workCountry: 1,
          },
        },
        friendList: {
          _id: 1,
          name: 1,
          age: 1,
          appUsesType: 1,
          email: 1,
          mobileNumber: 1,
          emailVerified: 1,
          maritalStatus: 1,
          displayName: 1,
          firstName: 1,
          lastName: 1,
          gender: 1,
          dateOfBirth: 1,
          randomId: 1,
          birthTime: 1,
          religion: 1,
          caste: 1,
          hobbies: 1,
          interest: 1,
          homeMobileNumber: 1,
          creatingProfileFor: 1,
          writeBoutYourSelf: 1,
          hideProfileDuration: 1,
          community: 1,
          motherTongue: 1,
          weight: 1,
          profilePic: 1,
          isUserActive: 1,
          userUniqueId: 1,
          diet: 1,
          userProfilePic: 1,
          userProfileVideo: 1,
          profileHideAndDelete: 1,
          address: {
            _id: 1,
            currentResidenceAddress: 1,
            currentCity: 1,
            state: 1,
            currentCountry: 1,
            createdAt: 1,
            updatedAt: 1,
          },
          education: {
            _id: 1,
            userId: 1,
            degree: 1,
            collage: 1,
            city: 1,
            state: 1,
            country: 1,
          },
          partner: {
            _id: 1,
            age: 1,
            diet: 1,
            hobbies: 1,
            city: 1,
            state: 1,
            country: 1,
            income: 1,
            height: 1,
          },
          professional: {
            _id: 1,
            jobTitle: 1,
            jobType: 1,
            companyName: 1,
            currentSalary: 1,
            workCity: 1,
            workCountry: 1,
          },
        },
      },
    },
    { $sort: { matchPercentage: -1 } }, // Sort by match percentage in descending order
    // todo

    // { $skip: (page - 1) * limit }, // Skip documents for pagination
    // { $skip: skip },
    // { $limit: limit }, // Limit the number of documents for pagination
    // {
    //   $facet: {
    //     paginatedResults: [{ $skip: skip }, { $limit: limit }],
    //     totalCount: [{ $count: 'count' }],
    //   },
    // },
    // {
    //   $addFields: {
    //     totalDocs: { $arrayElemAt: ['$totalCount.count', 0] },
    //     totalPages: {
    //       $ceil: {
    //         $divide: [{ $arrayElemAt: ['$totalCount.count', 0] }, limit],
    //       },
    //     },
    //     currentPage: page,
    //   },
    // },

    // Facet stage: Use facet to divide the pipeline into two outputs
    // todo
    {
      $facet: {
        // Facet for paginated results
        paginatedResults: [{ $skip: skip }, { $limit: limit }],
        // Facet for counting total documents
        totalCount: [{ $count: 'count' }],
      },
    },
    // Unwind totalCount array to get the actual count value
    {
      $unwind: {
        path: '$totalCount',
        preserveNullAndEmptyArrays: true,
      },
    },
    // Add pagination details
    {
      $addFields: {
        totalDocs: { $ifNull: ['$totalCount.count', 0] },
        totalPages: {
          $ceil: {
            $divide: ['$totalCount.count', limit],
          },
        },
        currentPage: page,
      },
    },
  ];
  const matchedUsers = await ProfileView.aggregate(pipeline).exec();

  return matchedUsers;
}

export async function getProfileVisitor(filter, options = {}) {
  const user = await ProfileView.find(filter, options.projection, options).populate({
    path: 'user',
    match: { appUsesType: 'dating' },
  });
  return user;
}
