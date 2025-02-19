import ApiError from 'utils/ApiError';
import httpStatus from 'http-status';
// eslint-disable-next-line no-unused-vars
import { Partner, User, Datingpartner, Like, Friend } from 'models';
import _ from 'lodash';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import moment from 'moment';
import { notificationService, userPlanService } from './index';
import enumModel, {
  EnumAppUsesTypeOfUsers,
  EnumGenderOfUsers,
  EnumOfPlatformType,
  EnumOfUserPlan,
  EnumStatusOfFriend,
} from '../models/enum.model';

export async function getUserById(id, options = {}) {
  const user = await User.findById(id, options.projection, options)
    .populate('address')
    .populate('userPartner')
    .populate('userEducation')
    .populate('userProfessional')
    .populate('userPartnerPrefForDating')
    .exec();
  return user;
}

// todo:check populate in database
export async function getOne(query, options = {}) {
  const user = await User.findOne(query, options.projection, options)
    .populate('address')
    .populate('userPartner')
    .populate('userEducation')
    .populate('userProfessional')
    .populate('userPartnerPrefForDating')
    .exec();
  return user;
}
export async function getUserList(filter, options = {}) {
  // eslint-disable-next-line no-param-reassign
  filter['profileHideAndDelete.isProfileHide'] = { $ne: true };
  const user = await User.find(filter, options.projection, options)
    .populate('address')
    .populate('userEducation')
    .populate('userPartner')
    .populate('userProfessional')
    .populate('userPartnerPrefForDating');
  return user;
}

export async function getUserListForSearch(
  filter,
  { currentCountry = [], currentCity = [] },
  page,
  limit,
  userId,
  appUsesType
) {
  // eslint-disable-next-line no-param-reassign
  filter['profileHideAndDelete.isProfileHide'] = { $ne: true };
  let userPartnerPreferences = null;

  if (appUsesType !== 'dating') {
    userPartnerPreferences = await Partner.findOne({ userId });
    if (!userPartnerPreferences) {
      throw new Error('User Partner Preferences not found. Please add Partner Preference first');
    }
  }
  const skip = (page - 1) * limit;

  // Use aggregation for both filtering and counting
  const pipeline = [
    {
      $match: filter,
    },
    {
      $lookup: {
        from: 'Address',
        localField: '_id',
        foreignField: 'userId',
        as: 'address',
      },
    },
    {
      $match: {
        ...(currentCountry && currentCountry.length && { 'address.currentCountry': { $in: currentCountry } }),
        ...(currentCity && currentCity.length && { 'address.currentCity': { $in: currentCity } }),
      },
    },
    {
      $match: {
        _id: { $ne: mongoose.Types.ObjectId(userId) }, // Exclude the current user
        platform: { $eq: EnumOfPlatformType.HAPPY_MILAN },
        appUsesType,
      },
    },
    {
      $lookup: {
        from: 'likes', // // The collection name for Like model
        let: {
          currentUserIdForLike: '$_id', // Reference to current document's userId
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$user', userId] }, { $eq: ['$likedUserId', '$$currentUserIdForLike'] }],
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
        preserveNullAndEmptyArrays: true, // Include users with no matching friends
      },
    },
    {
      $lookup: {
        from: 'shortlists', // // The collection name for Like model
        let: {
          currentUserIdForShortList: '$_id', // Reference to current document's userId
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$userId', userId] }, { $eq: ['$shortlistId', '$$currentUserIdForShortList'] }],
              },
            },
          },
        ],
        as: 'userShortListDetails',
      },
    },
    {
      $unwind: {
        path: '$userShortListDetails',
        preserveNullAndEmptyArrays: true, // Include users with no matching friends
      },
    },
    {
      $lookup: {
        from: 'Friend', // The collection name for Friend model
        let: {
          currentUserId: '$_id', // Reference to current document's userId
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$user', userId] }, { $eq: ['$friend', '$$currentUserId'] }],
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
            if: { $and: [{ $ne: ['$dateOfBirth', null] }, { $ne: ['$dateOfBirth', ''] }] },
            then: {
              $floor: {
                $divide: [
                  { $subtract: [new Date(), '$dateOfBirth'] },
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
        localField: '_id',
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
        localField: '_id',
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
      $unwind: {
        path: '$address', // Deconstructs the 'address' array field
        preserveNullAndEmptyArrays: true, // If you want to exclude documents with no address
      },
    },
    {
      $lookup: {
        from: 'UserPartner',
        localField: '_id', // User's `_id` field
        foreignField: 'userId', // Match with `userId` in `UserPartner`
        as: 'userPartnerDetails',
      },
    },
    {
      $addFields: {
        matchData: {
          $let: {
            vars: {
              totalCriteria: 4, // Update to the total number of criteria used
              matchedCriteria: {
                $add: [
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
                  {
                    $cond: [
                      {
                        $and: [
                          { $gte: ['$height', userPartnerPreferences.height.min] },
                          { $lte: ['$height', userPartnerPreferences.height.max] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                  { $cond: [{ $in: ['$address.currentCountry', userPartnerPreferences.country] }, 1, 0] },
                  { $cond: [{ $in: ['$address.currentCity', userPartnerPreferences.city] }, 1, 0] },
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
      $project: {
        _id: 1,
        age: 1,
        height: 1,
        'address._id': 1,
        'address.currentResidenceAddress': 1,
        'address.currentCity': 1,
        'address.state': 1,
        'address.currentCountry': 1,
        'address.createdAt': 1,
        'address.updatedAt': 1,
        name: 1,
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
        cast: 1,
        hobbies: 1,
        interest: 1,
        homeMobileNumber: 1,
        creatingProfileFor: 1,
        writeBoutYourSelf: 1,
        hideProfileDuration: 1,
        community: 1,
        motherTongue: 1,
        weight: 1,
        userEducation: 1,
        'userProfessional._id': 1,
        'userProfessional.jobTitle': 1,
        'userProfessional.jobType': 1,
        'userProfessional.companyName': 1,
        'userProfessional.currentSalary': 1,
        'userProfessional.workCity': 1,
        'userProfessional.workCountry': 1,
        profilePic: 1,
        userUniqueId: 1,
        diet: 1,
        userProfilePic: 1,
        userProfileVideo: 1,
        profileHideAndDelete: 1,
        'friendsDetails.status': 1,
        'friendsDetails._id': 1,
        matchPercentage: '$matchData.matchPercentage',
        matchedCriteria: '$matchData.matchedCriteria',
        isUserActive: 1,
        'userLikeDetails.isLike': 1,
        'userLikeDetails.user': 1,
        'userLikeDetails.likedUserId': 1,
        'userLikeDetails._id': 1,
        'userShortListDetails.userId': 1,
        'userShortListDetails.shortlistId': 1,
        'userShortListDetails._id': 1,
        'subscriptionDetails.status': 1,
        userPartnerDetails: 1,
      },
    },
    { $sort: { matchPercentage: -1 } },
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
  // Paginated results
  const users = await User.aggregate(pipeline).exec();

  // Calculate pagination metadata

  return users;
}

export async function getUserListWithPagination(filter, options = {}) {
  const user = await User.paginate(filter, options);
  return user;
}

export async function createUser(body) {
  // Check if the email is already taken
  if (body.email && (await User.isEmailTaken(body.email))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  // Check if the mobile number is already taken
  if (body.mobileNumber && (await User.isMobileNumberTaken(body.mobileNumber))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Mobile number already taken');
  }

  // If both checks pass, create the user
  const user = await User.create(body);
  return user;
}

export async function updateUser(filter, body, options = {}) {
  const userData = await getOne(filter, {});
  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'user not found');
  }
  if (body.email && (await User.isEmailTaken(body.email, userData.id))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  const user = await User.findOneAndUpdate(filter, body, options);
  return user;
}

export async function updateUserForAuth(filter, body, options = {}, user) {
  if (body.email && (await User.findOne({ email: body.email, _id: { $ne: user._id } }))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  if (body && body.password) {
    // eslint-disable-next-line no-param-reassign
    body.password = await bcrypt.hash(body.password, 10);
  }

  await User.updateOne(filter, body, options)
    .populate('address')
    .populate('userEducation')
    .populate('UserPartner')
    .populate('userProfessional');
  return getOne(filter);
}

export async function updateManyUser(filter, body, options = {}) {
  const user = await User.updateMany(filter, body, options);
  return user;
}

export async function removeUser(filter) {
  const user = await User.findOneAndRemove(filter);
  return user;
}

export async function removeManyUser(filter) {
  const user = await User.deleteMany(filter);
  return user;
}

export async function addDeviceToken(user, body) {
  const { deviceToken, platform } = body;
  const isFCMValid = notificationService.verifyFCMToken(deviceToken);
  if (!isFCMValid) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'The FCM Token is invalid!');
  }
  const deviceTokenList = user.deviceTokens.map((data) => data.deviceToken);
  if (_.indexOf(deviceTokenList, deviceToken) === -1) {
    user.deviceTokens.push({ deviceToken, platform });
    const updatedUser = await updateUser({ _id: user._id }, { $addToSet: { deviceTokens: { deviceToken } } }, { new: true });
    return updatedUser;
  }
  return user;
}

// Helper function to generate field projections
const createDynamicProjectionForPrivacySetting = (fields, defaultFields, isPremiumUser = false) => {
  const projection = {
    _id: 1,
    matchPercentage: '$matchData.matchPercentage',
    matchedCriteria: '$matchData.matchedCriteria',
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
  fields.forEach(({ name, conditions }) => {
    projection[name] = {
      $cond: {
        if: {
          $or: [
            // Check for `visibleToPremiumMember` and if the user is premium
            {
              $and: [
                { $eq: ['$privacySetting', 'visibleToPremiumMember'] },
                { $literal: isPremiumUser }, // Use `isPremiumUser` param
              ],
            },
            // Fallback to `privateProfile` fields if not premium
            {
              $and: [
                { $eq: ['$privacySetting', 'visibleToPremiumMember'] },
                { $not: { $literal: isPremiumUser } },
                { $in: ['privateProfile', conditions] },
              ],
            },
            // Check for `OnlyAcceptedMembers` and friend status
            {
              $and: [
                { $eq: ['$privacySetting', 'OnlyAcceptedMembers'] },
                { $eq: ['$friendsDetails.status', 'ACCEPTED'] }, // EnumStatusOfFriend.ACCEPTED
              ],
            },
            // // Fallback to `privateProfile` if friend status is not ACCEPTED
            {
              $and: [
                { $eq: ['$privacySetting', 'OnlyAcceptedMembers'] },
                { $ne: ['$friendsDetails.status', 'ACCEPTED'] },
                { $in: ['privateProfile', conditions] },
              ],
            },
            // Include other conditions
            {
              $in: [
                '$privacySetting',
                conditions.filter((c) => c !== 'visibleToPremiumMember' && c !== 'OnlyAcceptedMembers'),
              ],
            },
          ],
        },
        then: `$${name}`,
        else: null,
      },
    };
  });

  return projection;
};

export async function getGenderListV2(filter, options = {}) {
  const userGender = filter.gender;
  const { limit = 10, page = 1 } = options;

  let oppositeGender;
  if (userGender === EnumGenderOfUsers.MALE) {
    oppositeGender = EnumGenderOfUsers.FEMALE;
  } else if (userGender === EnumGenderOfUsers.FEMALE) {
    oppositeGender = EnumGenderOfUsers.MALE;
  } else {
    throw new Error('Invalid gender for logged-in user');
  }

  const userPartnerPreferences = await Partner.findOne({ userId: filter.userId });

  if (!userPartnerPreferences) {
    throw new Error('User Partner Preferences not found. Please add Partner Preference first');
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

  // Define fields and their privacy conditions
  const fields = [
    { name: 'displayName', conditions: ['privateProfile', 'visibleToPremiumMember', 'OnlyAcceptedMembers', 'default'] },
    { name: 'name', conditions: ['privateProfile', 'visibleToPremiumMember', 'OnlyAcceptedMembers', 'default'] },
    { name: 'firstName', conditions: ['privateProfile', 'visibleToPremiumMember', 'OnlyAcceptedMembers', 'default'] },
    { name: 'lastName', conditions: ['privateProfile', 'visibleToPremiumMember', 'OnlyAcceptedMembers', 'default'] },
    { name: 'profilePic', conditions: ['visibleToPremiumMember', 'OnlyAcceptedMembers', 'default'] },
    { name: 'userProfileVideo', conditions: ['visibleToPremiumMember', 'OnlyAcceptedMembers', 'default'] },
    { name: 'userProfilePic', conditions: ['visibleToPremiumMember', 'OnlyAcceptedMembers', 'default'] },
    { name: 'email', conditions: ['OnlyAcceptedMembers', 'default'] },
    { name: 'mobileNumber', conditions: ['OnlyAcceptedMembers', 'default'] },
    { name: 'randomId', conditions: ['OnlyAcceptedMembers', 'default'] },
  ];

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
    dateOfBirth: '$dateOfBirth',
    birthTime: '$birthTime',
    religion: '$religion',
    caste: '$caste',
    hobbies: '$hobbies',
    interest: '$interest',
    homeMobileNumber: '$homeMobileNumber',
    creatingProfileFor: '$creatingProfileFor',
    writeBoutYourSelf: '$writeBoutYourSelf',
    hideProfileDuration: '$hideProfileDuration',
    community: '$community',
    motherTongue: '$motherTongue',
    weight: '$weight',
    userEducation: '$userEducation',
    userProfessional: {
      _id: { $getField: { field: '_id', input: '$userProfessional' } },
      jobTitle: { $getField: { field: 'jobTitle', input: '$userProfessional' } },
      jobType: { $getField: { field: 'jobType', input: '$userProfessional' } },
      companyName: { $getField: { field: 'companyName', input: '$userProfessional' } },
      currentSalary: { $getField: { field: 'currentSalary', input: '$userProfessional' } },
      workCity: { $getField: { field: 'workCity', input: '$userProfessional' } },
      workCountry: { $getField: { field: 'workCountry', input: '$userProfessional' } },
    },
    userUniqueId: '$userUniqueId',
    diet: '$diet',
    profileHideAndDelete: '$profileHideAndDelete',
    isUserActive: '$isUserActive',
    userPartnerDetails: '$userPartnerDetails',
  };

  const pipeline = [
    {
      $match: {
        _id: { $ne: mongoose.Types.ObjectId(filter.userId) }, // Exclude the current user
        platform: { $eq: EnumOfPlatformType.HAPPY_MILAN },
        gender: oppositeGender,
        appUsesType: EnumAppUsesTypeOfUsers.MARRIAGE,
      },
    },
    {
      $lookup: {
        from: 'Subscription', // Ensure this matches the subscription collection name
        let: { userId: '$_id' }, // Reference the current user's ID
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$user', '$$userId'], // Match the user ID
              },
            },
          },
        ],
        as: 'subscriptionDetails',
      },
    },
    {
      $unwind: {
        path: '$subscriptionDetails',
        preserveNullAndEmptyArrays: true, // Include users even if they don't have any subscriptions
      },
    },
    {
      $lookup: {
        from: 'likes', // // The collection name for Like model
        let: {
          currentUserIdForLike: '$_id', // Reference to current document's userId
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$user', filter.userId] }, { $eq: ['$likedUserId', '$$currentUserIdForLike'] }],
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
        preserveNullAndEmptyArrays: true, // Include users with no matching friends
      },
    },
    {
      $lookup: {
        from: 'shortlists', // // The collection name for Like model
        let: {
          currentUserIdForShortList: '$_id', // Reference to current document's userId
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$userId', filter.userId] }, { $eq: ['$shortlistId', '$$currentUserIdForShortList'] }],
              },
            },
          },
        ],
        as: 'userShortListDetails',
      },
    },
    {
      $unwind: {
        path: '$userShortListDetails',
        preserveNullAndEmptyArrays: true, // Include users with no matching friends
      },
    },
    {
      $lookup: {
        from: 'Friend', // The collection name for Friend model
        let: {
          currentUserId: '$_id', // Reference to current document's userId
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  {
                    $and: [{ $eq: ['$user', filter.userId] }, { $eq: ['$friend', '$$currentUserId'] }],
                  },
                  {
                    $and: [{ $eq: ['$user', '$$currentUserId'] }, { $eq: ['$friend', filter.userId] }],
                  },
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
        preserveNullAndEmptyArrays: true, // Include users with no matching friends
      },
    },
    {
      $match: {
        $or: [
          { friendsDetails: { $exists: false } }, // Include users without any friend details
          // Case 2: Exclude blocked and accepted statuses
          {
            $and: [
              { 'friendsDetails.status': { $nin: [EnumStatusOfFriend.BLOCKED, EnumStatusOfFriend.ACCEPTED] } },
              {
                $or: [
                  // Keep REQUESTED status unless the user made the request
                  { $expr: { $ne: ['$friendsDetails.friend', filter.userId] } },
                  { 'friendsDetails.status': { $ne: EnumStatusOfFriend.REQUESTED } },
                ],
              },
            ],
          },
        ],
      },
    },
    {
      $addFields: {
        age: {
          $cond: {
            if: { $and: [{ $ne: ['$dateOfBirth', null] }, { $ne: ['$dateOfBirth', ''] }] },
            then: {
              $floor: {
                $divide: [
                  { $subtract: [new Date(), '$dateOfBirth'] },
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
        localField: '_id',
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
        localField: '_id',
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
      $unwind: {
        path: '$address', // Deconstructs the 'address' array field
        preserveNullAndEmptyArrays: true, // If you want to exclude documents with no address
      },
    },
    {
      $lookup: {
        from: 'UserPartner',
        localField: '_id', // User's `_id` field
        foreignField: 'userId', // Match with `userId` in `UserPartner`
        as: 'userPartnerDetails',
      },
    },
    {
      $addFields: {
        matchData: {
          $let: {
            vars: {
              totalCriteria: 4, // Update to the total number of criteria used
              matchedCriteria: {
                $add: [
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
                  {
                    $cond: [
                      {
                        $and: [
                          { $gte: ['$height', userPartnerPreferences.height.min] },
                          { $lte: ['$height', userPartnerPreferences.height.max] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                  { $cond: [{ $in: ['$address.currentCountry', userPartnerPreferences.country] }, 1, 0] },
                  { $cond: [{ $in: ['$address.currentCity', userPartnerPreferences.city] }, 1, 0] },
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
  const matchedUsers = await User.aggregate(pipeline).exec();
  return matchedUsers;
}

// user => current user id
// userID => other user id that we need to get
export async function getMatchUser(filter) {
  const userPartnerPreferences = await Partner.findOne({ userId: filter.user });
  if (!userPartnerPreferences) {
    throw new Error('User Partner Preferences not found. Please add Partner Preference first');
  }
  const pipeline = [
    {
      $match: {
        _id: { $eq: mongoose.Types.ObjectId(filter.userId) }, // only for the current user
        platform: { $eq: EnumOfPlatformType.HAPPY_MILAN },
      },
    },
    {
      $lookup: {
        from: 'likes',
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$user', mongoose.Types.ObjectId(filter.user)] },
                  { $eq: ['$likedUserId', mongoose.Types.ObjectId(filter.userId)] },
                ],
              },
            },
          },
        ],
        as: 'userLikeDetails',
      },
    },
    // Unwind arrays (preserve nulls for non-matching cases)
    {
      $unwind: {
        path: '$userLikeDetails',
        preserveNullAndEmptyArrays: true,
      },
    },
    // Lookup for Shortlists
    {
      $lookup: {
        from: 'shortlists',
        let: { currentUserIdForShortList: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$userId', mongoose.Types.ObjectId(filter.user)] },
                  { $eq: ['$shortlistId', '$$currentUserIdForShortList'] },
                ],
              },
            },
          },
        ],
        as: 'userShortListDetails',
      },
    },
    {
      $unwind: {
        path: '$userShortListDetails',
        preserveNullAndEmptyArrays: true,
      },
    },
    // Lookup for Friends
    {
      $lookup: {
        from: 'Friend',
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  {
                    $and: [
                      { $eq: ['$user', mongoose.Types.ObjectId(filter.user)] },
                      { $eq: ['$friend', mongoose.Types.ObjectId(filter.userId)] },
                    ],
                  },
                  {
                    $and: [
                      { $eq: ['$user', mongoose.Types.ObjectId(filter.userId)] },
                      { $eq: ['$friend', mongoose.Types.ObjectId(filter.user)] },
                    ],
                  },
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
        preserveNullAndEmptyArrays: true,
      },
    },
    // Filter out blocked friends
    {
      $match: {
        $or: [{ friendsDetails: { $exists: false } }, { 'friendsDetails.status': { $nin: [EnumStatusOfFriend.BLOCKED] } }],
      },
    },
    {
      $addFields: {
        age: {
          $cond: {
            if: { $and: [{ $ne: ['$dateOfBirth', null] }, { $ne: ['$dateOfBirth', ''] }] },
            then: {
              $floor: {
                $divide: [
                  { $subtract: [new Date(), '$dateOfBirth'] },
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
        localField: '_id',
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
        from: 'UserPartner',
        localField: '_id', // User's `_id` field
        foreignField: 'userId', // Match with `userId` in `UserPartner`
        as: 'userPartnerDetails',
      },
    },
    {
      $unwind: {
        path: '$userPartnerDetails',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'UserProfessionalDetail',
        localField: '_id',
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
        from: 'UserEducation',
        localField: '_id',
        foreignField: 'userId',
        as: 'userEducation',
      },
    },
    {
      $unwind: {
        path: '$userEducation',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        matchData: {
          $let: {
            vars: {
              totalCriteria: 4,
              matchedCriteria: {
                $add: [
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
                  {
                    $cond: [
                      {
                        $and: [
                          { $gte: ['$height', userPartnerPreferences.height.min] },
                          { $lte: ['$height', userPartnerPreferences.height.max] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                  { $cond: [{ $in: ['$address.currentCountry', userPartnerPreferences.country] }, 1, 0] },
                  { $cond: [{ $in: ['$address.currentCity', userPartnerPreferences.city] }, 1, 0] },
                ],
              },
              matchedFields: {
                $filter: {
                  input: [
                    {
                      field: 'age',
                      isMatched: {
                        $and: [
                          { $gte: ['$age', userPartnerPreferences.age.min] },
                          { $lte: ['$age', userPartnerPreferences.age.max] },
                        ],
                      },
                    },
                    {
                      field: 'height',
                      isMatched: {
                        $and: [
                          { $gte: ['$height', userPartnerPreferences.height.min] },
                          { $lte: ['$height', userPartnerPreferences.height.max] },
                        ],
                      },
                    },
                    {
                      field: 'currentCountry',
                      isMatched: { $in: ['$address.currentCountry', userPartnerPreferences.country] },
                    },
                    {
                      field: 'currentCity',
                      isMatched: { $in: ['$address.currentCity', userPartnerPreferences.city] },
                    },
                  ],
                  as: 'match',
                  cond: '$$match.isMatched',
                },
              },
            },
            in: {
              matchPercentage: {
                $multiply: [{ $divide: ['$$matchedCriteria', '$$totalCriteria'] }, 100],
              },
              matchedCriteria: '$$matchedCriteria',
              matchedFields: '$$matchedFields',
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        age: 1,
        height: 1,
        'address._id': 1,
        'address.currentResidenceAddress': 1,
        'address.currentCity': 1,
        'address.state': 1,
        'address.currentCountry': 1,
        'address.createdAt': 1,
        'address.updatedAt': 1,
        name: 1,
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
        userPartnerDetails: 1,
        userEducation: 1,
        userProfessional: 1,
        profilePic: 1,
        userUniqueId: 1,
        diet: 1,
        userProfilePic: 1,
        userProfileVideo: 1,
        profileHideAndDelete: 1,
        matchPercentage: '$matchData.matchPercentage',
        matchedCriteria: '$matchData.matchedCriteria',
        matchedFields: '$matchData.matchedFields', // Add matchedFields to output
        'friendsDetails.status': 1,
        'friendsDetails._id': 1,
        'userLikeDetails._id': 1,
        'userLikeDetails.isLike': 1,
        'userLikeDetails.user': 1,
        'userLikeDetails.likedUserId': 1,
        'userShortListDetails._id': 1,
        'userShortListDetails.shortlistId': 1,
        isUserActive: 1,
      },
    },
    { $sort: { matchPercentage: -1 } }, // Sort by match percentage in descending order
  ];
  const matchedUsers = await User.aggregate(pipeline).exec();
  return matchedUsers;
}

export async function getUserCounts(appUsesType) {
  const filter = appUsesType ? { appUsesType } : {};

  const totalUsers = await User.countDocuments(filter);
  const activeUsers = totalUsers;

  const oneWeekAgo = moment().subtract(7, 'days').toDate();

  const lastWeekRegisteredUsers = await User.countDocuments({
    ...filter,
    createdAt: { $gte: oneWeekAgo },
  });

  const onlineUsers = await User.countDocuments({
    ...filter,
    isUserActive: true,
  });

  const totalMaleUsers = await User.countDocuments({
    ...filter,
    gender: enumModel.EnumGenderOfUsers.MALE,
  });

  const totalFemaleUsers = await User.countDocuments({
    ...filter,
    gender: enumModel.EnumGenderOfUsers.FEMALE,
  });

  return {
    totalUsers,
    activeUsers,
    lastWeekRegisteredUsers,
    onlineUsers,
    totalMaleUsers,
    totalFemaleUsers,
  };
}

export async function getDatingPartnerList(filter, options = {}) {
  const userGender = filter.gender;
  const { limit = 10, page = 1 } = options;

  let oppositeGender;
  if (userGender === EnumGenderOfUsers.MALE) {
    oppositeGender = EnumGenderOfUsers.FEMALE;
  } else if (userGender === EnumGenderOfUsers.FEMALE) {
    oppositeGender = EnumGenderOfUsers.MALE;
  } else {
    throw new Error('Invalid gender for logged-in user');
  }

  // Fetch the user's dating partner preferences
  const userPartnerPreferences = await Datingpartner.findOne({ userId: filter.userId });

  // Log the preferences for debugging
  console.log('User Dating Partner Preferences:', JSON.stringify(userPartnerPreferences));

  // If no preferences are found, throw an error
  if (!userPartnerPreferences) {
    throw new Error('User Dating Preferences not found. Please add preferences first');
  }

  // Handle potential issues with undefined age ranges
  if (!userPartnerPreferences.age || !userPartnerPreferences.age.min || !userPartnerPreferences.age.max) {
    throw new Error('Age preferences (min or max) are missing or invalid in userPartnerPreferences');
  }

  const skip = (page - 1) * limit;

  const pipeline = [
    {
      $match: {
        _id: { $ne: mongoose.Types.ObjectId(filter.userId) }, // Exclude the current user
        appUsesType: EnumAppUsesTypeOfUsers.DATING,
        platform: { $eq: EnumOfPlatformType.HAPPY_MILAN },
        gender: oppositeGender,
      },
    },
    {
      $lookup: {
        from: 'likes',
        let: { currentUserIdForLike: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$user', filter.userId] }, { $eq: ['$likedUserId', '$$currentUserIdForLike'] }],
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
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'shortlists',
        let: { currentUserIdForShortList: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$userId', filter.userId] }, { $eq: ['$shortlistId', '$$currentUserIdForShortList'] }],
              },
            },
          },
        ],
        as: 'userShortListDetails',
      },
    },
    {
      $unwind: {
        path: '$userShortListDetails',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'Friend',
        let: { currentUserId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$user', filter.userId] }, { $eq: ['$friend', '$$currentUserId'] }],
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
        preserveNullAndEmptyArrays: true,
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
            if: { $and: [{ $ne: ['$dateOfBirth', null] }, { $ne: ['$dateOfBirth', ''] }] },
            then: {
              $floor: {
                $divide: [
                  { $subtract: [new Date(), '$dateOfBirth'] },
                  31556952000, // Average milliseconds in a year (365.25 days)
                ],
              },
            },
            else: null, // or any default value you'd like to use if dateOfBirth is missing
          },
        },
        matchData: {
          $let: {
            vars: {
              totalCriteria: 3, // Now three criteria: age, interestedIn, and preferredLocation
              matchedCriteria: {
                $add: [
                  {
                    $cond: [
                      {
                        $and: [
                          { $gte: ['$age', userPartnerPreferences.age.min] }, // Use calculated age
                          { $lte: ['$age', userPartnerPreferences.age.max] }, // Use calculated age
                        ],
                      },
                      1, // Increment matched criteria by 1 if age matches
                      0, // Otherwise, add 0
                    ],
                  },
                  {
                    $let: {
                      vars: {
                        userInterests: {
                          $ifNull: ['$datingData.interestedIn', []],
                        },
                        preferencesInterests: userPartnerPreferences.interestedIn || [],
                      },
                      in: {
                        $cond: [
                          {
                            $gt: [
                              {
                                $size: {
                                  $setIntersection: [
                                    {
                                      $reduce: {
                                        input: { $ifNull: ['$datingData', []] },
                                        initialValue: [],
                                        in: {
                                          $concatArrays: ['$$value', '$$this.interestedIn'],
                                        },
                                      },
                                    },
                                    '$$preferencesInterests',
                                  ],
                                },
                              },
                              0,
                            ],
                          },
                          1, // Increment matched criteria by 1 if interests overlap
                          0,
                        ],
                      },
                    },
                  },
                  {
                    // Check for location match
                    $cond: [
                      {
                        $in: ['$datingData.CurrentlyLiving', userPartnerPreferences.preferredLocation],
                      },
                      1, // Increment matched criteria by 1 if location matches
                      0,
                    ],
                  },
                ],
              },
            },
            in: {
              matchPercentage: {
                $multiply: [{ $divide: ['$$matchedCriteria', '$$totalCriteria'] }, 100], // Calculate match percentage
              },
              matchedCriteria: '$$matchedCriteria',
              ageMatch: {
                $cond: [
                  {
                    $and: [
                      { $gte: ['$age', userPartnerPreferences.age.min] },
                      { $lte: ['$age', userPartnerPreferences.age.max] },
                    ],
                  },
                  true, // Age matches
                  false, // Age doesn't match
                ],
              },
              interestedInMatch: {
                $cond: [
                  {
                    $gt: [
                      {
                        $size: {
                          $setIntersection: [
                            {
                              $reduce: {
                                input: { $ifNull: ['$datingData', []] },
                                initialValue: [],
                                in: {
                                  $concatArrays: ['$$value', '$$this.interestedIn'],
                                },
                              },
                            },
                            userPartnerPreferences.interestedIn || [],
                          ],
                        },
                      },
                      0,
                    ],
                  },
                  true, // InterestedIn matches
                  false, // InterestedIn doesn't match
                ],
              },
              locationMatch: {
                $cond: [
                  {
                    $in: ['$datingData.CurrentlyLiving', userPartnerPreferences.preferredLocation],
                  },
                  true, // Location matches
                  false, // Location doesn't match
                ],
              },
            },
          },
        },
      },
    },
    {
      $lookup: {
        from: 'Address',
        localField: '_id',
        foreignField: 'userId',
        as: 'address',
      },
    },
    {
      $unwind: {
        path: '$address',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'UserProfessionalDetail',
        localField: '_id',
        foreignField: 'userId',
        as: 'userProfessional',
      },
    },
    {
      $unwind: {
        path: '$userProfessional',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        age: 1,
        height: 1,
        name: 1,
        email: 1,
        mobileNumber: 1,
        appUsesType: 1,
        profilePic: 1,
        gender: 1, // Assuming gender is required
        religion: 1,
        motherTongue: 1,
        maritalStatus: 1,
        education: 1,
        occupation: 1,
        annualIncome: 1,
        userProfilePic: 1,
        country: 1,
        state: 1,
        city: 1,
        bio: 1,
        hobbies: 1,
        'datingData.interestedIn': 1, // Field for dating preferences from partner model
        'datingData.Occupation': 1, // Field for dating preferences from partner model
        'datingData.CurrentlyLiving': 1, // Field for dating preferences from partner model
        distance: 1, // Assuming this field represents calculated distance
        'userLikeDetails._id': 1,
        'userLikeDetails.isLike': 1,
        'userLikeDetails.user': 1,
        'userLikeDetails.likedUserId': 1,
        'userShortListDetails._id': 1,
        'userShortListDetails.shortlistId': 1,
        'friendsDetails.status': 1,
        'friendsDetails._id': 1,
        'address.currentCountry': 1,
        'address.currentCity': 1,
        'userProfessional.profession': 1,
        'userProfessional.company': 1,
        isUserActive: 1,
      },
    },
    { $sort: { matchPercentage: -1 } },
    {
      $facet: {
        paginatedResults: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: 'count' }],
      },
    },
    {
      $unwind: {
        path: '$totalCount',
        preserveNullAndEmptyArrays: true,
      },
    },
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

  const matchedUsers = await User.aggregate(pipeline).exec();
  return matchedUsers;
}

export async function getDatingPartnerListByAgeAndMatch(filter, ageRange, options = {}) {
  const userGender = filter.gender;
  const { limit = 10, page = 1 } = options;
  const { minAge, maxAge } = ageRange;

  let oppositeGender;
  if (userGender === EnumGenderOfUsers.MALE) {
    oppositeGender = EnumGenderOfUsers.FEMALE;
  } else if (userGender === EnumGenderOfUsers.FEMALE) {
    oppositeGender = EnumGenderOfUsers.MALE;
  } else {
    throw new Error('Invalid gender for logged-in user');
  }

  // Fetch the user's dating partner preferences
  const userPartnerPreferences = await Datingpartner.findOne({ userId: filter.userId });

  // Handle potential issues with undefined age ranges
  // eslint-disable-next-line no-restricted-globals
  if (!minAge || !maxAge || isNaN(minAge) || isNaN(maxAge)) {
    throw new Error('Invalid or missing minAge and maxAge in the request');
  }

  const skip = (page - 1) * limit;
  const currentDate = new Date();

  // Create a new Date object for maxAge and minAge to prevent issues with date manipulation
  const maxAgeDate = new Date(currentDate);
  maxAgeDate.setFullYear(maxAgeDate.getFullYear() - maxAge);

  const minAgeDate = new Date(currentDate);
  minAgeDate.setFullYear(minAgeDate.getFullYear() - minAge);

  const pipeline = [
    {
      $match: {
        _id: { $ne: mongoose.Types.ObjectId(filter.userId) }, // Exclude the current user
        appUsesType: EnumAppUsesTypeOfUsers.DATING,
        platform: { $eq: EnumOfPlatformType.HAPPY_MILAN },
        gender: oppositeGender,
        // Filter based on age calculated from dateOfBirth
        dateOfBirth: {
          $gte: maxAgeDate, // Users who are younger than maxAge
          $lte: minAgeDate, // Users who are older than minAge
        },
      },
    },
    {
      $lookup: {
        from: 'likes',
        let: { currentUserIdForLike: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$user', filter.userId] }, { $eq: ['$likedUserId', '$$currentUserIdForLike'] }],
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
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'shortlists',
        let: { currentUserIdForShortList: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$userId', filter.userId] }, { $eq: ['$shortlistId', '$$currentUserIdForShortList'] }],
              },
            },
          },
        ],
        as: 'userShortListDetails',
      },
    },
    {
      $unwind: {
        path: '$userShortListDetails',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'Friend', // The collection name for Friend model
        let: {
          currentUserId: '$_id', // Reference to current document's userId
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  {
                    $and: [{ $eq: ['$user', filter.userId] }, { $eq: ['$friend', '$$currentUserId'] }],
                  },
                  {
                    $and: [{ $eq: ['$user', '$$currentUserId'] }, { $eq: ['$friend', filter.userId] }],
                  },
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
        preserveNullAndEmptyArrays: true, // Include users with no matching friends
      },
    },
    {
      $match: {
        $or: [
          { friendsDetails: { $exists: false } }, // Include users without any friend details
          // Case 2: Exclude blocked and accepted statuses
          {
            $and: [
              { 'friendsDetails.status': { $nin: [EnumStatusOfFriend.BLOCKED, EnumStatusOfFriend.ACCEPTED] } },
              {
                $or: [
                  // Keep REQUESTED status unless the user made the request
                  { $expr: { $ne: ['$friendsDetails.friend', filter.userId] } },
                  { 'friendsDetails.status': { $ne: EnumStatusOfFriend.REQUESTED } },
                ],
              },
            ],
          },
        ],
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
            if: { $and: [{ $ne: ['$dateOfBirth', null] }, { $ne: ['$dateOfBirth', ''] }] },
            then: {
              $floor: {
                $divide: [
                  { $subtract: [new Date(), '$dateOfBirth'] },
                  31556952000, // Average milliseconds in a year (365.25 days)
                ],
              },
            },
            else: null, // or any default value you'd like to use if dateOfBirth is missing
          },
        },
        matchData: {
          $let: {
            vars: {
              totalCriteria: 3, // Now three criteria: age, interestedIn, and preferredLocation
              matchedCriteria: {
                $add: [
                  {
                    $cond: [
                      {
                        $and: [
                          { $gte: ['$age', minAge] }, // Match against provided minAge
                          { $lte: ['$age', maxAge] }, // Match against provided maxAge
                        ],
                      },
                      1, // Increment matched criteria by 1 if age matches
                      0, // Otherwise, add 0
                    ],
                  },
                  {
                    $let: {
                      vars: {
                        userInterests: {
                          $ifNull: ['$datingData.interestedIn', []],
                        },
                        preferencesInterests: userPartnerPreferences.interestedIn || [],
                      },
                      in: {
                        $cond: [
                          {
                            $gt: [
                              {
                                $size: {
                                  $setIntersection: [
                                    {
                                      $reduce: {
                                        input: { $ifNull: ['$datingData', []] },
                                        initialValue: [],
                                        in: {
                                          $concatArrays: ['$$value', '$$this.interestedIn'],
                                        },
                                      },
                                    },
                                    '$$preferencesInterests',
                                  ],
                                },
                              },
                              0,
                            ],
                          },
                          1, // Increment matched criteria by 1 if interests overlap
                          0,
                        ],
                      },
                    },
                  },
                  {
                    // Check for location match
                    $cond: [
                      {
                        $in: ['$datingData.CurrentlyLiving', userPartnerPreferences.preferredLocation],
                      },
                      1, // Increment matched criteria by 1 if location matches
                      0,
                    ],
                  },
                ],
              },
            },
            in: {
              matchPercentage: {
                $multiply: [{ $divide: ['$$matchedCriteria', '$$totalCriteria'] }, 100], // Calculate match percentage
              },
              matchedCriteria: '$$matchedCriteria',
              ageMatch: {
                $cond: [
                  {
                    $and: [
                      { $gte: ['$age', minAge] }, // Match against provided minAge
                      { $lte: ['$age', maxAge] }, // Match against provided maxAge
                    ],
                  },
                  true, // Age matches
                  false, // Age doesn't match
                ],
              },
              interestedInMatch: {
                $cond: [
                  {
                    $gt: [
                      {
                        $size: {
                          $setIntersection: [
                            {
                              $reduce: {
                                input: { $ifNull: ['$datingData', []] },
                                initialValue: [],
                                in: {
                                  $concatArrays: ['$$value', '$$this.interestedIn'],
                                },
                              },
                            },
                            userPartnerPreferences.interestedIn || [],
                          ],
                        },
                      },
                      0,
                    ],
                  },
                  true, // InterestedIn matches
                  false, // InterestedIn doesn't match
                ],
              },
              locationMatch: {
                $cond: [
                  {
                    $in: ['$datingData.CurrentlyLiving', userPartnerPreferences.preferredLocation],
                  },
                  true, // Location matches
                  false, // Location doesn't match
                ],
              },
            },
          },
        },
      },
    },
    {
      $lookup: {
        from: 'Address',
        localField: '_id',
        foreignField: 'userId',
        as: 'address',
      },
    },
    {
      $unwind: {
        path: '$address',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'UserProfessionalDetail',
        localField: '_id',
        foreignField: 'userId',
        as: 'userProfessional',
      },
    },
    {
      $unwind: {
        path: '$userProfessional',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        age: 1,
        height: 1,
        name: 1,
        email: 1,
        mobileNumber: 1,
        appUsesType: 1,
        profilePic: 1,
        gender: 1, // Assuming gender is required
        bio: 1,
        hobbies: 1,
        userLikeDetails: 1,
        userShortListDetails: 1,
        friendsDetails: 1,
        'datingData.interestedIn': 1, // Field for dating preferences from partner model
        'datingData.Occupation': 1, // Field for dating preferences from partner model
        'datingData.CurrentlyLiving': 1, // Field for dating preferences from partner model
        distance: 1, // Assuming this field represents calculated distance
        matchData: 1, // Match data containing criteria
      },
    },
    { $sort: { 'matchData.matchPercentage': -1 } }, // Sort by match percentage
    {
      $facet: {
        paginatedResults: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: 'count' }],
      },
    },
    {
      $unwind: {
        path: '$totalCount',
        preserveNullAndEmptyArrays: true,
      },
    },
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

  const matchedUsers = await User.aggregate(pipeline).exec();
  return matchedUsers;
}

export async function getUserWithDatingData(filter) {
  const userId = filter._id;

  const pipeline = [
    {
      $match: {
        _id: mongoose.Types.ObjectId(userId),
        platform: EnumOfPlatformType.HAPPY_MILAN,
        appUsesType: EnumAppUsesTypeOfUsers.DATING,
      },
    },
    {
      $lookup: {
        from: 'Friend',
        let: { currentUserId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$user', filter.userId] }, { $eq: ['$friend', '$$currentUserId'] }],
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
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        'friendsDetails.status': { $ne: EnumStatusOfFriend.BLOCKED },
      },
    },
    // Populate datingData field (based on your schema)
    {
      $project: {
        _id: 1,
        age: 1,
        height: 1,
        name: 1,
        email: 1,
        mobileNumber: 1,
        gender: 1,
        dateOfBirth: 1,
        isUserActive: 1,
        datingData: {
          interestedIn: 1,
          Ethnicity: 1,
          educationLevel: 1,
          CurrentlyLiving: 1,
          Occupation: 1,
          annualIncome: 1,
        },
        appUsesType: 1,
        userProfilePic: 1,
        profilePic: 1,
        hobbies: 1,
        writeBoutYourSelf: 1,
        religion: 1,
        'friendsDetails.status': 1,
        'friendsDetails._id': 1,
      },
    },
  ];

  const matchedUser = await User.aggregate(pipeline).exec();
  return matchedUser;
}

export async function getFilteredDatingInterestList(filter, options = {}) {
  const { interestedIn } = filter;
  const { limit = 10, page = 1 } = options;

  if (!interestedIn || typeof interestedIn !== 'string') {
    throw new Error('Please provide a valid "interestedIn" filter as a string');
  }

  const skip = (page - 1) * limit;

  const pipeline = [
    {
      $match: {
        _id: { $ne: mongoose.Types.ObjectId(filter.userId) }, // Exclude the current user
        appUsesType: EnumAppUsesTypeOfUsers.DATING,
        platform: { $eq: EnumOfPlatformType.HAPPY_MILAN },
        'datingData.interestedIn': interestedIn, // Filter based on single interestedIn value
      },
    },
    {
      $lookup: {
        from: 'Friend',
        let: { currentUserId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$user', filter.userId] }, { $eq: ['$friend', '$$currentUserId'] }],
              },
            },
          },
        ],
        as: 'friendsDetails',
      },
    },
    {
      $lookup: {
        from: 'likes',
        let: { currentUserIdForLike: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$user', filter.userId] }, { $eq: ['$likedUserId', '$$currentUserIdForLike'] }],
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
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'shortlists',
        let: { currentUserIdForShortList: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$userId', filter.userId] }, { $eq: ['$shortlistId', '$$currentUserIdForShortList'] }],
              },
            },
          },
        ],
        as: 'userShortListDetails',
      },
    },
    {
      $unwind: {
        path: '$userShortListDetails',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        mobileNumber: 1,
        appUsesType: 1,
        profilePic: 1,
        gender: 1, // Assuming gender is still required
        bio: 1,
        hobbies: 1,
        userProfilePic: 1,
        writeBoutYourSelf: 1,
        religion: 1,
        friendsDetails: 1,
        'datingData.interestedIn': 1,
        'datingData.Occupation': 1,
        'datingData.CurrentlyLiving': 1,
        'datingData.educationLevel': 1,
        'datingData.Ethnicity': 1,
        'datingData.annualIncome': 1,
        'userLikeDetails.isLike': 1,
        'userLikeDetails._id': 1,
        'userLikeDetails.user': 1,
        'userLikeDetails.likedUserId': 1,
        'userShortListDetails._id': 1,
        'userShortListDetails.shortlistId': 1,
      },
    },
    { $sort: { _id: 1 } }, // Sort by ID or another field as required
    {
      $facet: {
        paginatedResults: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: 'count' }],
      },
    },
    {
      $unwind: {
        path: '$totalCount',
        preserveNullAndEmptyArrays: true,
      },
    },
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

  const matchedUsers = await User.aggregate(pipeline).exec();
  return matchedUsers;
}

export async function getPrimeUserList(filter, options = {}) {
  const userGender = filter.gender;
  const { limit = 10, page = 1 } = options;

  let oppositeGender;
  if (userGender === EnumGenderOfUsers.MALE) {
    oppositeGender = EnumGenderOfUsers.FEMALE;
  } else if (userGender === EnumGenderOfUsers.FEMALE) {
    oppositeGender = EnumGenderOfUsers.MALE;
  } else {
    throw new Error('Invalid gender for logged-in user');
  }

  const userPartnerPreferences = await Partner.findOne({ userId: filter.userId });

  if (!userPartnerPreferences) {
    throw new Error('User Partner Preferences not found. Please add Partner Preference first');
  }

  const skip = (page - 1) * limit;

  const pipeline = [
    {
      $match: {
        _id: { $ne: mongoose.Types.ObjectId(filter.userId) }, // Exclude the current user
        platform: { $eq: EnumOfPlatformType.HAPPY_MILAN },
        gender: oppositeGender,
        appUsesType: EnumAppUsesTypeOfUsers.MARRIAGE,
      },
    },
    {
      $lookup: {
        from: 'Subscription', // Ensure this matches the subscription collection name
        let: { userId: '$_id' }, // Reference the current user's ID
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$user', '$$userId'] }, // Match the user ID
                  { $eq: ['$status', 'active'] }, // Only include active subscriptions
                ],
              },
            },
          },
        ],
        as: 'subscriptionDetails',
      },
    },
    {
      $unwind: {
        path: '$subscriptionDetails',
        preserveNullAndEmptyArrays: false, // Exclude users without active subscriptions
      },
    },
    {
      $lookup: {
        from: 'likes', // The collection name for Like model
        let: {
          currentUserIdForLike: '$_id', // Reference to current document's userId
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$user', filter.userId] }, { $eq: ['$likedUserId', '$$currentUserIdForLike'] }],
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
        preserveNullAndEmptyArrays: true, // Include users with no matching friends
      },
    },
    {
      $lookup: {
        from: 'shortlists', // The collection name for Shortlist model
        let: {
          currentUserIdForShortList: '$_id', // Reference to current document's userId
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$userId', filter.userId] }, { $eq: ['$shortlistId', '$$currentUserIdForShortList'] }],
              },
            },
          },
        ],
        as: 'userShortListDetails',
      },
    },
    {
      $unwind: {
        path: '$userShortListDetails',
        preserveNullAndEmptyArrays: true, // Include users with no matching friends
      },
    },
    {
      $lookup: {
        from: 'Friend', // The collection name for Friend model
        let: {
          currentUserId: '$_id', // Reference to current document's userId
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$user', filter.userId] }, { $eq: ['$friend', '$$currentUserId'] }],
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
            if: { $and: [{ $ne: ['$dateOfBirth', null] }, { $ne: ['$dateOfBirth', ''] }] },
            then: {
              $floor: {
                $divide: [
                  { $subtract: [new Date(), '$dateOfBirth'] },
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
        localField: '_id',
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
        localField: '_id',
        foreignField: 'userId',
        as: 'userProfessional',
      },
    },
    {
      $unwind: {
        path: '$userProfessional', // Deconstructs the 'userProfessional' array field
        preserveNullAndEmptyArrays: true, // Include users without professional details
      },
    },
    {
      $addFields: {
        matchData: {
          $let: {
            vars: {
              totalCriteria: 4, // Update to the total number of criteria used
              matchedCriteria: {
                $add: [
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
                  {
                    $cond: [
                      {
                        $and: [
                          { $gte: ['$height', userPartnerPreferences.height.min] },
                          { $lte: ['$height', userPartnerPreferences.height.max] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                  { $cond: [{ $in: ['$address.currentCountry', userPartnerPreferences.country] }, 1, 0] },
                  { $cond: [{ $in: ['$address.currentCity', userPartnerPreferences.city] }, 1, 0] },
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
      $project: {
        _id: 1,
        age: 1,
        height: 1,
        'address._id': 1,
        'address.currentResidenceAddress': 1,
        'address.currentCity': 1,
        'address.state': 1,
        'address.currentCountry': 1,
        'address.createdAt': 1,
        'address.updatedAt': 1,
        name: 1,
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
        cast: 1,
        hobbies: 1,
        interest: 1,
        homeMobileNumber: 1,
        creatingProfileFor: 1,
        writeBoutYourSelf: 1,
        hideProfileDuration: 1,
        community: 1,
        motherTongue: 1,
        weight: 1,
        userPartner: 1,
        userEducation: 1,
        'userProfessional._id': 1,
        'userProfessional.jobTitle': 1,
        'userProfessional.jobType': 1,
        'userProfessional.companyName': 1,
        'userProfessional.currentSalary': 1,
        'userProfessional.workCity': 1,
        'userProfessional.workCountry': 1,
        profilePic: 1,
        userUniqueId: 1,
        diet: 1,
        userProfilePic: 1,
        userProfileVideo: 1,
        profileHideAndDelete: 1,
        matchPercentage: '$matchData.matchPercentage',
        matchedCriteria: '$matchData.matchedCriteria',
        'friendsDetails.status': 1,
        'friendsDetails._id': 1,
        isUserActive: 1,
        'userLikeDetails.isLike': 1,
        'userLikeDetails.user': 1,
        'userLikeDetails.likedUserId': 1,
        'userLikeDetails._id': 1,
        'userShortListDetails.userId': 1,
        'userShortListDetails.shortlistId': 1,
        'userShortListDetails._id': 1,
        'subscriptionDetails.status': 1,
      },
    },
    { $sort: { matchPercentage: -1 } },
    {
      $facet: {
        paginatedResults: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: 'count' }],
      },
    },
    {
      $unwind: {
        path: '$totalCount',
        preserveNullAndEmptyArrays: true,
      },
    },
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
  const matchedUsers = await User.aggregate(pipeline).exec();
  return matchedUsers;
}

export async function getUserStats(userId) {
  // Filter for likes: based on likedUserId
  const likeFilter = {
    likedUserId: userId,
    isLike: true,
  };

  // 1. Total Likes (likedUserId = userId and isLike = true)
  const totalLikes = await Like.countDocuments(likeFilter);

  // Filter for friends based on the user who initiated the requests
  const friendFilter = {
    user: userId,
  };

  // 2. Total Requests Sent (status = 'requested')
  const totalRequestsSent = await Friend.countDocuments({
    ...friendFilter,
    status: enumModel.EnumStatusOfFriend.REQUESTED,
  });

  // 3. Total Accepted Requests (status = 'accepted')
  const totalAcceptedRequests = await Friend.countDocuments({
    ...friendFilter,
    status: enumModel.EnumStatusOfFriend.ACCEPTED,
  });
  const friendReqFilter = {
    friend: userId,
    status: EnumStatusOfFriend.REQUESTED,
  };
  const totalRequestsReceived = await Friend.countDocuments({
    ...friendReqFilter,
    status: enumModel.EnumStatusOfFriend.REQUESTED,
  });
  // Return the counts in a structured way
  return {
    totalLikes,
    totalRequestsSent,
    totalAcceptedRequests,
    totalRequestsReceived,
  };
}

export async function getNewUserList(filter, options = {}) {
  const userGender = filter.gender;
  const { limit = 10, page = 1 } = options;

  let oppositeGender;
  if (userGender === EnumGenderOfUsers.MALE) {
    oppositeGender = EnumGenderOfUsers.FEMALE;
  } else if (userGender === EnumGenderOfUsers.FEMALE) {
    oppositeGender = EnumGenderOfUsers.MALE;
  } else {
    throw new Error('Invalid gender for logged-in user');
  }

  const userPartnerPreferences = await Partner.findOne({ userId: filter.userId });

  if (!userPartnerPreferences) {
    throw new Error('User Partner Preferences not found. Please add Partner Preference first');
  }

  const skip = (page - 1) * limit;

  const pipeline = [
    {
      $match: {
        _id: { $ne: mongoose.Types.ObjectId(filter.userId) }, // Exclude the current user
        platform: { $eq: EnumOfPlatformType.HAPPY_MILAN },
        gender: oppositeGender,
        appUsesType: EnumAppUsesTypeOfUsers.MARRIAGE,
        // Assuming you have a 'lastLogin' field or similar field to track user login times
        updatedAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 7)), // Only users who had activity within the last 7 days
        },
      },
    },
    {
      $lookup: {
        from: 'Subscription', // Ensure this matches the subscription collection name
        let: { userId: '$_id' }, // Reference the current user's ID
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$user', '$$userId'], // Match the user ID
              },
            },
          },
        ],
        as: 'subscriptionDetails',
      },
    },
    {
      $unwind: {
        path: '$subscriptionDetails',
        preserveNullAndEmptyArrays: true, // Include users even if they don't have any subscriptions
      },
    },
    {
      $lookup: {
        from: 'likes', // The collection name for Like model
        let: {
          currentUserIdForLike: '$_id', // Reference to current document's userId
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$user', filter.userId] }, { $eq: ['$likedUserId', '$$currentUserIdForLike'] }],
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
        preserveNullAndEmptyArrays: true, // Include users with no matching friends
      },
    },
    {
      $lookup: {
        from: 'shortlists', // The collection name for Shortlist model
        let: {
          currentUserIdForShortList: '$_id', // Reference to current document's userId
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$userId', filter.userId] }, { $eq: ['$shortlistId', '$$currentUserIdForShortList'] }],
              },
            },
          },
        ],
        as: 'userShortListDetails',
      },
    },
    {
      $unwind: {
        path: '$userShortListDetails',
        preserveNullAndEmptyArrays: true, // Include users with no matching friends
      },
    },
    {
      $lookup: {
        from: 'Friend', // The collection name for Friend model
        let: {
          currentUserId: '$_id', // Reference to current document's userId
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$user', filter.userId] }, { $eq: ['$friend', '$$currentUserId'] }],
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
        preserveNullAndEmptyArrays: true, // Include users with no matching friends
      },
    },
    {
      $match: {
        $or: [
          { friendsDetails: { $exists: false } }, // Include users without any friend details
          { 'friendsDetails.status': { $nin: [EnumStatusOfFriend.BLOCKED, EnumStatusOfFriend.ACCEPTED] } }, // Exclude BLOCKED and ACCEPTED statuses
        ],
      },
    },
    {
      $addFields: {
        age: {
          $cond: {
            if: { $and: [{ $ne: ['$dateOfBirth', null] }, { $ne: ['$dateOfBirth', ''] }] },
            then: {
              $floor: {
                $divide: [
                  { $subtract: [new Date(), '$dateOfBirth'] },
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
        localField: '_id',
        foreignField: 'userId',
        as: 'address',
      },
    },
    {
      $unwind: {
        path: '$address',
        preserveNullAndEmptyArrays: true, // Include users with no address
      },
    },
    {
      $lookup: {
        from: 'UserProfessionalDetail',
        localField: '_id',
        foreignField: 'userId',
        as: 'userProfessional',
      },
    },
    {
      $unwind: {
        path: '$userProfessional',
        preserveNullAndEmptyArrays: true, // Include users with no professional details
      },
    },
    {
      $addFields: {
        matchData: {
          $let: {
            vars: {
              totalCriteria: 4, // Update to the total number of criteria used
              matchedCriteria: {
                $add: [
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
                  {
                    $cond: [
                      {
                        $and: [
                          { $gte: ['$height', userPartnerPreferences.height.min] },
                          { $lte: ['$height', userPartnerPreferences.height.max] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                  { $cond: [{ $in: ['$address.currentCountry', userPartnerPreferences.country] }, 1, 0] },
                  { $cond: [{ $in: ['$address.currentCity', userPartnerPreferences.city] }, 1, 0] },
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
      $project: {
        _id: 1,
        age: 1,
        height: 1,
        'address._id': 1,
        'address.currentResidenceAddress': 1,
        'address.currentCity': 1,
        'address.state': 1,
        'address.currentCountry': 1,
        'address.createdAt': 1,
        'address.updatedAt': 1,
        name: 1,
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
        cast: 1,
        hobbies: 1,
        interest: 1,
        homeMobileNumber: 1,
        creatingProfileFor: 1,
        writeBoutYourSelf: 1,
        hideProfileDuration: 1,
        community: 1,
        motherTongue: 1,
        weight: 1,
        userPartner: 1,
        userEducation: 1,
        'userProfessional._id': 1,
        'userProfessional.jobTitle': 1,
        'userProfessional.jobType': 1,
        'userProfessional.companyName': 1,
        'userProfessional.currentSalary': 1,
        'userProfessional.workCity': 1,
        'userProfessional.workCountry': 1,
        profilePic: 1,
        userUniqueId: 1,
        diet: 1,
        userProfilePic: 1,
        userProfileVideo: 1,
        profileHideAndDelete: 1,
        'friendsDetails.status': 1,
        'friendsDetails._id': 1,
        matchPercentage: '$matchData.matchPercentage',
        matchedCriteria: '$matchData.matchedCriteria',
        isUserActive: 1,
        'userLikeDetails.isLike': 1,
        'userLikeDetails.user': 1,
        'userLikeDetails.likedUserId': 1,
        'userLikeDetails._id': 1,
        'userShortListDetails.userId': 1,
        'userShortListDetails.shortlistId': 1,
        'userShortListDetails._id': 1,
        'subscriptionDetails.status': 1,
      },
    },
    { $sort: { matchPercentage: -1 } }, // Sort by match percentage in descending order
    {
      $facet: {
        paginatedResults: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: 'count' }],
      },
    },
    {
      $unwind: {
        path: '$totalCount',
        preserveNullAndEmptyArrays: true,
      },
    },
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

  const matchedUsers = await User.aggregate(pipeline).exec();
  return matchedUsers;
}
/**
 * Check for missing fields for a logged-in user
 * @param {ObjectId} userId - The logged-in user's ID
 * @returns {Object} Object containing the user data and missing fields
 */
export async function checkMissingFields(userId) {
  // Define categories with their corresponding fields
  const fieldCategories = {
    createProfile: ['creatingProfileFor', 'birthTime', 'dateOfBirth', 'lastName', 'firstName'],
    generalDetails: ['writeBoutYourSelf', 'height', 'weight', 'caste', 'religion', 'maritalStatus', 'gender'],
    contactDetails: ['email', 'homeMobileNumber', 'mobileNumber'],
    hobbies: ['hobbies'],
  };

  const requiredAddressFields = ['currentCity', 'currentCountry', 'currentState'];
  const requiredEducationFields = ['degree', 'collage'];
  const requiredProfessionalFields = ['jobTitle', 'jobType', 'companyName', 'currentSalary', 'workCity', 'workCountry'];

  // Fetch user details from the database
  const user = await User.findById(userId)
    .populate('address') // Populate the address field
    .populate('userEducation') // Populate the user education field
    .populate('userProfessional') // Populate the user professional details
    .exec();

  if (!user) {
    throw new Error('User not found');
  }

  // Initialize object to store missing fields by category
  const missingFields = {
    createProfile: [],
    generalDetails: [],
    contactDetails: [],
    hobbies: [],
    address: [],
    education: [],
    professional: [],
  };

  // Check for missing fields in each category
  Object.entries(fieldCategories).forEach(([category, fields]) => {
    missingFields[category] = fields.filter((field) => {
      const value = user[field];
      return value === null || value === undefined || value === ''; // Check for empty, null, or undefined values
    });
  });

  if (user.hobbies === null || user.hobbies === undefined || user.hobbies.length === 0) {
    missingFields.hobbies = ['Hobbies field is missing'];
  }

  // Check for missing fields in address
  if (user.address) {
    missingFields.address = requiredAddressFields.filter((field) => {
      const value = user.address[field];
      return value === null || value === undefined || value === ''; // Check for missing values
    });
  } else {
    missingFields.address = ['Address is missing'];
  }

  // Check for missing fields in education
  if (user.userEducation) {
    missingFields.education = requiredEducationFields.filter((field) => {
      const value = user.userEducation[field];
      return value === null || value === undefined || value === ''; // Check for missing values
    });
  } else {
    missingFields.education = ['Education details are missing'];
  }

  // Check for missing fields in professional
  if (user.userProfessional) {
    missingFields.professional = requiredProfessionalFields.filter((field) => {
      const value = user.userProfessional[field];
      return value === null || value === undefined || value === ''; // Check for missing values
    });
  } else {
    missingFields.professional = ['Professional details are missing'];
  }

  return missingFields;
}

export async function checkMissingFieldsMobile(userId) {
  // Define categories with their corresponding fields
  const fieldCategories = {
    basicDetails: ['writeBoutYourSelf', 'height', 'weight', 'caste', 'religion', 'maritalStatus', 'gender'], // renamed 'generalDetails' to 'basicDetails'
    contactDetails: ['email', 'homeMobileNumber', 'mobileNumber'],
    hobbiesAndInterest: ['hobbies'],
  };
  console.log('=====xx====>', fieldCategories);
  const requiredLocationDetailsFields = ['currentCity', 'currentCountry', 'currentState']; // renamed 'address' to 'locationDetails'
  const requiredEducationDetailsFields = ['degree', 'collage']; // renamed 'education' to 'educationDetails'
  const requiredProfessionalFields = ['jobTitle', 'jobType', 'companyName', 'currentSalary', 'workCity', 'workCountry'];

  // Fetch user details from the database
  const user = await User.findById(userId)
    .populate('address') // Populate the address field
    .populate('userEducation') // Populate the user education field
    .populate('userProfessional') // Populate the user professional details
    .exec();

  if (!user) {
    throw new Error('User not found');
  }

  // Initialize object to store missing fields by category
  const missingFields = {
    basicDetails: [], // renamed 'generalDetails' to 'basicDetails'
    contactDetails: [],
    hobbiesAndInterest: [], // renamed 'hobbies' to 'hobbiesAndInterest'
    locationDetails: [], // renamed 'address' to 'locationDetails'
    educationDetails: [], // renamed 'education' to 'educationDetails'
    professional: [],
  };

  // Check for missing fields in each category
  Object.entries(fieldCategories).forEach(([category, fields]) => {
    missingFields[category] = fields.filter((field) => {
      const value = user[field];
      return value === null || value === undefined || value === ''; // Check for empty, null, or undefined values
    });
  });

  if (user.hobbies === null || user.hobbies === undefined || user.hobbies.length === 0) {
    missingFields.hobbiesAndInterest = ['Hobbies is missing'];
  }
  // Check for missing fields in locationDetails (previously address)
  if (user.address) {
    missingFields.locationDetails = requiredLocationDetailsFields.filter((field) => {
      const value = user.address[field];
      return value === null || value === undefined || value === ''; // Check for missing values
    });
  } else {
    missingFields.locationDetails = ['Location details are missing']; // updated message
  }

  // Check for missing fields in educationDetails (previously education)
  if (user.userEducation) {
    missingFields.educationDetails = requiredEducationDetailsFields.filter((field) => {
      const value = user.userEducation[field];
      return value === null || value === undefined || value === ''; // Check for missing values
    });
  } else {
    missingFields.educationDetails = ['Education details are missing']; // updated message
  }

  // Check for missing fields in professional
  if (user.userProfessional) {
    missingFields.professional = requiredProfessionalFields.filter((field) => {
      const value = user.userProfessional[field];
      return value === null || value === undefined || value === ''; // Check for missing values
    });
  } else {
    missingFields.professional = ['Professional details are missing'];
  }

  return missingFields;
}
