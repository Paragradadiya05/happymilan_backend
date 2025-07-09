import ApiError from 'utils/ApiError';
import httpStatus from 'http-status';
// eslint-disable-next-line no-unused-vars
import { Partner, User, Datingpartner, Like, Friend } from 'models';
import _ from 'lodash';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import moment from 'moment';
import { notificationService, userPlanService, imageBlurService } from './index'; // Added imageBlurService
import enumModel, {
  EnumAppUsesTypeOfUsers,
  EnumGenderOfUsers,
  EnumOfPlatformType,
  EnumOfUserPlan,
  EnumStatusOfFriend,
} from '../models/enum.model';
import {
  createDynamicProjectionForPrivacySetting,
  createDynamicProjectionForPrivacySettingForDating,
} from '../utils/common';

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
  const userPartnerPreferences = await Partner.findOne({ userId });
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
    { name: 'address' },
    { name: 'gender' },

    // contact details this will be hidden for all
    // { name: 'email', conditions: ['default', EnumOfPrivacySetting.PUBLIC_PROFILE] },
    // { name: 'mobileNumber', conditions: ['default', EnumOfPrivacySetting.PUBLIC_PROFILE] },

    // education details
    { name: 'userEducation' },

    // Professional Details
    { name: 'userProfessional' },
    { name: 'hobbies' },
    { name: 'userPartnerDetails' },
    { name: 'userUniqueId' },
    { name: 'privacySetting' },
    { name: 'motherTongue' },
    { name: 'isUserActive' },
    { name: 'age' },
    { name: 'maritalStatus' },
    { name: 'writeBoutYourSelf' },
    { name: 'profilePhotoPrivacy' },
    { name: 'privacySettingCustom' },
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
    // userEducation: {
    //   _id: { $getField: { field: '_id', input: '$userEducation' } },
    //   degree: { $getField: { field: 'degree', input: '$userEducation' } },
    //   collage: { $getField: { field: 'collage', input: '$userEducation' } },
    //   city: { $getField: { field: 'city', input: '$userEducation' } },
    //   state: { $getField: { field: 'state', input: '$userEducation' } },
    //   country: { $getField: { field: 'country', input: '$userEducation' } },
    // },
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
    privacySetting: '$privacySetting',
    privacySettingCustom: '$privacySettingCustom',
    profilePhotoPrivacy: '$profilePhotoPrivacy',
  };

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
      $project: createDynamicProjectionForPrivacySetting(fields, defaultFields, isPremiumUser),
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
  // Use standard checks instead of optional chaining to avoid potential ESLint parsing issues
  const oldPrivacyValue = user.privacySettingCustom && user.privacySettingCustom.profilePhotoPrivacy;
  const newPrivacyValue = body.privacySettingCustom && body.privacySettingCustom.profilePhotoPrivacy;
  const profilePicUrl = user.profilePic; // Get profile pic URL from state before update

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

  // --- Handle profile photo privacy change ---
  if (profilePicUrl && typeof newPrivacyValue === 'boolean' && newPrivacyValue !== oldPrivacyValue) {
    if (newPrivacyValue === true) {
      // Privacy enabled: Pre-generate blurred image (fire-and-forget, log errors)
      console.log(`User ${user._id} enabled profile photo privacy. Generating blurred image for ${profilePicUrl}...`);
      imageBlurService.blurImage(profilePicUrl).catch((err) => {
        console.error(`Error pre-generating blurred image for user ${user._id} (URL: ${profilePicUrl}):`, err);
      });
    } else {
      // Privacy disabled: Delete existing blurred image (fire-and-forget, log errors)
      console.log(`User ${user._id} disabled profile photo privacy. Deleting blurred image for ${profilePicUrl}...`);
      imageBlurService.deleteBlurredImageForOriginal(profilePicUrl).catch((err) => {
        console.error(`Error deleting blurred image for user ${user._id} (URL: ${profilePicUrl}):`, err);
      });
    }
  }

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

export async function getGenderListV2(filter, options = {}) {
  const userGender = filter.gender;
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 10;

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
    { name: 'address' },
    { name: 'gender' },

    // contact details this will be hidden for all
    // { name: 'email', conditions: ['default', EnumOfPrivacySetting.PUBLIC_PROFILE] },
    // { name: 'mobileNumber', conditions: ['default', EnumOfPrivacySetting.PUBLIC_PROFILE] },

    // education details
    { name: 'userEducation' },

    // Professional Details
    { name: 'userProfessional' },
    { name: 'hobbies' },
    { name: 'userPartnerDetails' },
    { name: 'userUniqueId' },
    { name: 'privacySetting' },
    { name: 'motherTongue' },
    { name: 'isUserActive' },
    { name: 'age' },
    { name: 'maritalStatus' },
    { name: 'writeBoutYourSelf' },
    { name: 'profilePhotoPrivacy' },
    { name: 'privacySettingCustom' },
    { name: 'zodiac' },
    { name: 'gothra' },
    { name: 'manglikStatus' },
    { name: 'language' },
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

    // userEducation: {
    //   _id: { $getField: { field: '_id', input: '$userEducation' } },
    //   degree: { $getField: { field: 'degree', input: '$userEducation' } },
    //   collage: { $getField: { field: 'collage', input: '$userEducation' } },
    //   city: { $getField: { field: 'city', input: '$userEducation' } },
    //   state: { $getField: { field: 'state', input: '$userEducation' } },
    //   country: { $getField: { field: 'country', input: '$userEducation' } },
    // },
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
    privacySetting: '$privacySetting',
    privacySettingCustom: '$privacySettingCustom',
    profilePhotoPrivacy: '$profilePhotoPrivacy',
    showPhotoToFriendsOnly: '$showPhotoToFriendsOnly',
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
              totalCriteria: 8, // Total number of fields you're matching
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
                  {
                    $cond: [
                      {
                        $and: [
                          { $gte: ['$userProfessional.currentSalary', userPartnerPreferences.income.min] },
                          { $lte: ['$userProfessional.currentSalary', userPartnerPreferences.income.max] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                  {
                    $cond: [{ $in: ['$address.currentCountry', userPartnerPreferences.country] }, 1, 0],
                  },
                  {
                    $cond: [{ $in: ['$address.state', userPartnerPreferences.state] }, 1, 0],
                  },
                  {
                    $cond: [{ $in: ['$address.currentCity', userPartnerPreferences.city] }, 1, 0],
                  },
                  {
                    $cond: [
                      {
                        $gt: [
                          {
                            $size: {
                              $setIntersection: [
                                { $ifNull: [{ $arrayElemAt: ['$userPartnerDetails.diet', 0] }, []] },
                                userPartnerPreferences.diet,
                              ],
                            },
                          },
                          0,
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                  {
                    $cond: [
                      {
                        $gt: [{ $size: { $setIntersection: ['$hobbies', userPartnerPreferences.hobbies] } }, 0],
                      },
                      1,
                      0,
                    ],
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
    // for remove duplicate user
    {
      $group: {
        _id: '$_id',
        doc: { $first: '$$ROOT' },
      },
    },
    {
      $replaceRoot: {
        newRoot: '$doc',
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
  console.log('userPartnerPreferences:', JSON.stringify(userPartnerPreferences));

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
    { name: 'address' },
    { name: 'gender' },

    // contact details this will be hidden for all
    // { name: 'email', conditions: ['default', EnumOfPrivacySetting.PUBLIC_PROFILE] },
    // { name: 'mobileNumber', conditions: ['default', EnumOfPrivacySetting.PUBLIC_PROFILE] },

    // education details
    { name: 'userEducation' },

    // Professional Details
    { name: 'userProfessional' },
    { name: 'hobbies' },
    { name: 'userPartnerDetails' },
    { name: 'userUniqueId' },
    { name: 'privacySetting' },
    { name: 'motherTongue' },
    { name: 'isUserActive' },
    { name: 'age' },
    { name: 'maritalStatus' },
    { name: 'writeBoutYourSelf' },
    { name: 'profilePhotoPrivacy' },
    { name: 'privacySettingCustom' },
    { name: 'zodiac' },
    { name: 'gothra' },
    { name: 'manglikStatus' },
    { name: 'language' },
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
    // userEducation: {
    //   _id: { $getField: { field: '_id', input: '$userEducation' } },
    //   degree: { $getField: { field: 'degree', input: '$userEducation' } },
    //   collage: { $getField: { field: 'collage', input: '$userEducation' } },
    //   city: { $getField: { field: 'city', input: '$userEducation' } },
    //   state: { $getField: { field: 'state', input: '$userEducation' } },
    //   country: { $getField: { field: 'country', input: '$userEducation' } },
    // },
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
    privacySetting: '$privacySetting',
    privacySettingCustom: '$privacySettingCustom',
    profilePhotoPrivacy: '$profilePhotoPrivacy',
  };

  const pipeline = [
    {
      $match: {
        _id: { $eq: mongoose.Types.ObjectId(filter.userId) }, // only for the current user
        platform: { $eq: EnumOfPlatformType.HAPPY_MILAN },
      },
    },
    {
      $lookup: {
        from: 'Subscription',
        let: { userId: mongoose.Types.ObjectId(filter.userId) },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$user', '$$userId'],
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
        preserveNullAndEmptyArrays: true,
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
              totalCriteria: 8,
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
                          { $gte: ['$userProfessional.currentSalary', userPartnerPreferences.income.min] },
                          { $lte: ['$userProfessional.currentSalary', userPartnerPreferences.income.max] },
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
                  { $cond: [{ $in: ['$address.currentCity', userPartnerPreferences.city] }, 1, 0] },
                  {
                    $cond: [
                      {
                        $gt: [{ $size: { $setIntersection: ['$userPartnerDetails.diet', userPartnerPreferences.diet] } }, 0],
                      },
                      1,
                      0,
                    ],
                  },
                  // Hobbies
                  {
                    $cond: [
                      {
                        $gt: [{ $size: { $setIntersection: ['$hobbies', userPartnerPreferences.hobbies] } }, 0],
                      },
                      1,
                      0,
                    ],
                  },
                ],
              },
              matchedFields: {
                $map: {
                  input: [
                    { field: 'age', value: '$age', expected: '$userPartnerDetails.age' },
                    { field: 'height', value: '$height', expected: '$userPartnerDetails.height' },
                    { field: 'income', value: '$userProfessional.currentSalary', expected: '$userPartnerDetails.income' },
                    { field: 'currentCountry', value: '$address.currentCountry', expected: '$userPartnerDetails.country' },
                    { field: 'currentState', value: '$address.state', expected: '$userPartnerDetails.state' },
                    { field: 'currentCity', value: '$address.currentCity', expected: '$userPartnerDetails.city' },
                    { field: 'diet', value: '$userPartnerDetails.diet', expected: '$userPartnerDetails.diet' }, // comparing to self is OK
                    { field: 'hobbies', value: '$hobbies', expected: '$userPartnerDetails.hobbies' },
                  ],
                  as: 'item',
                  in: {
                    field: '$$item.field',
                    value: '$$item.value',
                    expected: '$$item.expected',
                    isMatched: {
                      $switch: {
                        branches: [
                          {
                            case: { $eq: ['$$item.field', 'age'] },
                            then: {
                              $and: [
                                { $gte: ['$$item.value', '$$item.expected.min'] },
                                { $lte: ['$$item.value', '$$item.expected.max'] },
                              ],
                            },
                          },
                          {
                            case: { $eq: ['$$item.field', 'height'] },
                            then: {
                              $and: [
                                { $gte: ['$$item.value', '$$item.expected.min'] },
                                { $lte: ['$$item.value', '$$item.expected.max'] },
                              ],
                            },
                          },
                          {
                            case: { $eq: ['$$item.field', 'income'] },
                            then: {
                              $and: [
                                { $gte: ['$$item.value', '$$item.expected.min'] },
                                { $lte: ['$$item.value', '$$item.expected.max'] },
                              ],
                            },
                          },
                          {
                            case: { $eq: ['$$item.field', 'currentCountry'] },
                            then: { $in: ['$$item.value', '$$item.expected'] },
                          },
                          {
                            case: { $eq: ['$$item.field', 'currentState'] },
                            then: { $in: ['$$item.value', '$$item.expected'] },
                          },
                          {
                            case: { $eq: ['$$item.field', 'currentCity'] },
                            then: { $in: ['$$item.value', '$$item.expected'] },
                          },
                          {
                            case: { $eq: ['$$item.field', 'diet'] },
                            then: {
                              $gt: [{ $size: { $setIntersection: ['$$item.value', '$$item.expected'] } }, 0],
                            },
                          },
                          {
                            case: { $eq: ['$$item.field', 'hobbies'] },
                            then: {
                              $gt: [{ $size: { $setIntersection: ['$$item.value', '$$item.expected'] } }, 0],
                            },
                          },
                        ],
                        default: false,
                      },
                    },
                  },
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
      $project: createDynamicProjectionForPrivacySetting(fields, defaultFields, isPremiumUser),
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
    { name: 'address' },
    { name: 'gender' },
    { name: 'datingData' },

    // contact details this will be hidden for all
    // { name: 'email', conditions: ['default', EnumOfPrivacySetting.PUBLIC_PROFILE] },
    // { name: 'mobileNumber', conditions: ['default', EnumOfPrivacySetting.PUBLIC_PROFILE] },

    // education details
    { name: 'userEducation' },

    // Professional Details
    { name: 'userProfessional' },
    { name: 'hobbies' },
    { name: 'userPartnerDetails' },
    { name: 'userUniqueId' },
    { name: 'privacySetting' },
    { name: 'motherTongue' },
    { name: 'isUserActive' },
    { name: 'age' },
    { name: 'maritalStatus' },
    { name: 'writeBoutYourSelf' },
    { name: 'profilePhotoPrivacy' },
    { name: 'privacySettingCustom' },
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

    // userEducation: {
    //   _id: { $getField: { field: '_id', input: '$userEducation' } },
    //   degree: { $getField: { field: 'degree', input: '$userEducation' } },
    //   collage: { $getField: { field: 'collage', input: '$userEducation' } },
    //   city: { $getField: { field: 'city', input: '$userEducation' } },
    //   state: { $getField: { field: 'state', input: '$userEducation' } },
    //   country: { $getField: { field: 'country', input: '$userEducation' } },
    // },
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
    privacySetting: '$privacySetting',
    privacySettingCustom: '$privacySettingCustom',
    profilePhotoPrivacy: '$profilePhotoPrivacy',
  };

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
      $match: {
        $or: [
          { friendsDetails: { $eq: [] } }, // No friend relation
          {
            // Make sure every element in friendsDetails array is not in undesired statuses
            friendsDetails: {
              $not: {
                $elemMatch: {
                  status: { $in: [EnumStatusOfFriend.REQUESTED, EnumStatusOfFriend.ACCEPTED, EnumStatusOfFriend.BLOCKED] },
                },
              },
            },
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
      $project: createDynamicProjectionForPrivacySettingForDating(fields, defaultFields, isPremiumUser),
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
    { name: 'address' },
    { name: 'gender' },
    { name: 'datingData' },

    // contact details this will be hidden for all
    // { name: 'email', conditions: ['default', EnumOfPrivacySetting.PUBLIC_PROFILE] },
    // { name: 'mobileNumber', conditions: ['default', EnumOfPrivacySetting.PUBLIC_PROFILE] },

    // education details
    { name: 'userEducation' },

    // Professional Details
    { name: 'userProfessional' },
    { name: 'hobbies' },
    { name: 'userPartnerDetails' },
    { name: 'userUniqueId' },
    { name: 'privacySetting' },
    { name: 'motherTongue' },
    { name: 'isUserActive' },
    { name: 'age' },
    { name: 'maritalStatus' },
    { name: 'writeBoutYourSelf' },
    { name: 'profilePhotoPrivacy' },
    { name: 'privacySettingCustom' },
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

    // userEducation: {
    //   _id: { $getField: { field: '_id', input: '$userEducation' } },
    //   degree: { $getField: { field: 'degree', input: '$userEducation' } },
    //   collage: { $getField: { field: 'collage', input: '$userEducation' } },
    //   city: { $getField: { field: 'city', input: '$userEducation' } },
    //   state: { $getField: { field: 'state', input: '$userEducation' } },
    //   country: { $getField: { field: 'country', input: '$userEducation' } },
    // },
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
    privacySetting: '$privacySetting',
    privacySettingCustom: '$privacySettingCustom',
    profilePhotoPrivacy: '$profilePhotoPrivacy',
  };

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
          { friendsDetails: { $exists: false } },
          {
            'friendsDetails.status': {
              $nin: [EnumStatusOfFriend.REQUESTED, EnumStatusOfFriend.ACCEPTED, EnumStatusOfFriend.BLOCKED],
            },
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
      $project: createDynamicProjectionForPrivacySettingForDating(fields, defaultFields, isPremiumUser),
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
    { name: 'address' },
    { name: 'gender' },
    { name: 'datingData' },

    // contact details this will be hidden for all
    // { name: 'email', conditions: ['default', EnumOfPrivacySetting.PUBLIC_PROFILE] },
    // { name: 'mobileNumber', conditions: ['default', EnumOfPrivacySetting.PUBLIC_PROFILE] },

    // education details
    { name: 'userEducation' },

    // Professional Details
    { name: 'userProfessional' },
    { name: 'hobbies' },
    { name: 'userPartnerDetails' },
    { name: 'userUniqueId' },
    { name: 'privacySetting' },
    { name: 'motherTongue' },
    { name: 'isUserActive' },
    { name: 'age' },
    { name: 'maritalStatus' },
    { name: 'writeBoutYourSelf' },
    { name: 'profilePhotoPrivacy' },
    { name: 'privacySettingCustom' },
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

    // userEducation: {
    //   _id: { $getField: { field: '_id', input: '$userEducation' } },
    //   degree: { $getField: { field: 'degree', input: '$userEducation' } },
    //   collage: { $getField: { field: 'collage', input: '$userEducation' } },
    //   city: { $getField: { field: 'city', input: '$userEducation' } },
    //   state: { $getField: { field: 'state', input: '$userEducation' } },
    //   country: { $getField: { field: 'country', input: '$userEducation' } },
    // },
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
    privacySetting: '$privacySetting',
    privacySettingCustom: '$privacySettingCustom',
    profilePhotoPrivacy: '$profilePhotoPrivacy',
  };
  const pipeline = [
    {
      $match: {
        _id: mongoose.Types.ObjectId(userId),
        platform: EnumOfPlatformType.HAPPY_MILAN,
        appUsesType: EnumAppUsesTypeOfUsers.DATING,
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
                $or: [
                  {
                    $and: [
                      { $eq: ['$user', mongoose.Types.ObjectId(filter.currentUserId._id)] },
                      { $eq: ['$friend', '$$currentUserId'] },
                    ],
                  },
                  {
                    $and: [
                      { $eq: ['$user', '$$currentUserId'] },
                      { $eq: ['$friend', mongoose.Types.ObjectId(filter.currentUserId._id)] },
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
      $lookup: {
        from: 'likes',
        let: { currentUserIdForLike: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$user', mongoose.Types.ObjectId(filter.currentUserId._id)] },
                  { $eq: ['$likedUserId', '$$currentUserIdForLike'] },
                ],
              },
            },
          },
        ],
        as: 'userLikeDetails',
      },
    },
    {
      $match: {
        'friendsDetails.status': { $ne: EnumStatusOfFriend.BLOCKED },
      },
    },

    // Populate datingData field (based on your schema)
    {
      $project: createDynamicProjectionForPrivacySettingForDating(fields, defaultFields, isPremiumUser),
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
    { name: 'address' },
    { name: 'gender' },
    { name: 'datingData' },

    // contact details this will be hidden for all
    // { name: 'email', conditions: ['default', EnumOfPrivacySetting.PUBLIC_PROFILE] },
    // { name: 'mobileNumber', conditions: ['default', EnumOfPrivacySetting.PUBLIC_PROFILE] },

    // education details
    { name: 'userEducation' },

    // Professional Details
    { name: 'userProfessional' },
    { name: 'hobbies' },
    { name: 'userPartnerDetails' },
    { name: 'userUniqueId' },
    { name: 'privacySetting' },
    { name: 'motherTongue' },
    { name: 'isUserActive' },
    { name: 'age' },
    { name: 'maritalStatus' },
    { name: 'writeBoutYourSelf' },
    { name: 'profilePhotoPrivacy' },
    { name: 'privacySettingCustom' },
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

    // userEducation: {
    //   _id: { $getField: { field: '_id', input: '$userEducation' } },
    //   degree: { $getField: { field: 'degree', input: '$userEducation' } },
    //   collage: { $getField: { field: 'collage', input: '$userEducation' } },
    //   city: { $getField: { field: 'city', input: '$userEducation' } },
    //   state: { $getField: { field: 'state', input: '$userEducation' } },
    //   country: { $getField: { field: 'country', input: '$userEducation' } },
    // },
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
    privacySetting: '$privacySetting',
    privacySettingCustom: '$privacySettingCustom',
    profilePhotoPrivacy: '$profilePhotoPrivacy',
  };
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
      $match: {
        $or: [
          { friendsDetails: { $exists: false } },
          {
            'friendsDetails.status': {
              $nin: [EnumStatusOfFriend.REQUESTED, EnumStatusOfFriend.ACCEPTED, EnumStatusOfFriend.BLOCKED],
            },
          },
        ],
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
      },
    },
    {
      $project: createDynamicProjectionForPrivacySettingForDating(fields, defaultFields, isPremiumUser),
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
  // console.log('=====pipeline====>', pipeline);
  const matchedUsers = await User.aggregate(pipeline).exec();
  return matchedUsers;
}

export async function getFilteredDatingEthnicityList(filter, options = {}) {
  const { Ethnicity } = filter;
  const { limit = 10, page = 1 } = options;

  if (!Ethnicity || typeof Ethnicity !== 'string') {
    throw new Error('Please provide a valid "city" filter as a string');
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
    { name: 'address' },
    { name: 'gender' },
    { name: 'datingData' },

    // contact details this will be hidden for all
    // { name: 'email', conditions: ['default', EnumOfPrivacySetting.PUBLIC_PROFILE] },
    // { name: 'mobileNumber', conditions: ['default', EnumOfPrivacySetting.PUBLIC_PROFILE] },

    // education details
    { name: 'userEducation' },

    // Professional Details
    { name: 'userProfessional' },
    { name: 'hobbies' },
    { name: 'userPartnerDetails' },
    { name: 'userUniqueId' },
    { name: 'privacySetting' },
    { name: 'motherTongue' },
    { name: 'isUserActive' },
    { name: 'age' },
    { name: 'maritalStatus' },
    { name: 'writeBoutYourSelf' },
    { name: 'profilePhotoPrivacy' },
    { name: 'privacySettingCustom' },
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

    // userEducation: {
    //   _id: { $getField: { field: '_id', input: '$userEducation' } },
    //   degree: { $getField: { field: 'degree', input: '$userEducation' } },
    //   collage: { $getField: { field: 'collage', input: '$userEducation' } },
    //   city: { $getField: { field: 'city', input: '$userEducation' } },
    //   state: { $getField: { field: 'state', input: '$userEducation' } },
    //   country: { $getField: { field: 'country', input: '$userEducation' } },
    // },
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
    privacySetting: '$privacySetting',
    privacySettingCustom: '$privacySettingCustom',
    profilePhotoPrivacy: '$profilePhotoPrivacy',
  };
  const pipeline = [
    {
      $match: {
        _id: { $ne: mongoose.Types.ObjectId(filter.userId) }, // Exclude the current user
        appUsesType: EnumAppUsesTypeOfUsers.DATING,
        platform: { $eq: EnumOfPlatformType.HAPPY_MILAN },
        'datingData.Ethnicity': Ethnicity, // Filter based on single interestedIn value
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
                  31556952000, // Average milliseconds in a year (365.25 days)
                ],
              },
            },
            else: null, // or any default value you'd like to use if dateOfBirth is missing
          },
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
      $project: createDynamicProjectionForPrivacySettingForDating(fields, defaultFields, isPremiumUser),
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
    $or: [
      { user: userId, status: enumModel.EnumStatusOfFriend.ACCEPTED },
      { friend: userId, status: enumModel.EnumStatusOfFriend.ACCEPTED },
    ],
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
    { name: 'address' },
    { name: 'gender' },
    { name: 'Subscription' },
    { name: 'zodiac' },
    { name: 'gothra' },
    { name: 'manglikStatus' },
    { name: 'language' },

    // contact details this will be hidden for all
    // { name: 'email', conditions: ['default', EnumOfPrivacySetting.PUBLIC_PROFILE] },
    // { name: 'mobileNumber', conditions: ['default', EnumOfPrivacySetting.PUBLIC_PROFILE] },

    // education details
    { name: 'userEducation' },

    // Professional Details
    { name: 'userProfessional' },
    { name: 'hobbies' },
    { name: 'userPartnerDetails' },
    { name: 'userUniqueId' },
    { name: 'privacySetting' },
    { name: 'motherTongue' },
    { name: 'isUserActive' },
    { name: 'age' },
    { name: 'maritalStatus' },
    { name: 'writeBoutYourSelf' },
    { name: 'privacySettingCustom' },
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
    Subscription: '$Subscription',
    // userEducation: {
    //   _id: { $getField: { field: '_id', input: '$userEducation' } },
    //   degree: { $getField: { field: 'degree', input: '$userEducation' } },
    //   collage: { $getField: { field: 'collage', input: '$userEducation' } },
    //   city: { $getField: { field: 'city', input: '$userEducation' } },
    //   state: { $getField: { field: 'state', input: '$userEducation' } },
    //   country: { $getField: { field: 'country', input: '$userEducation' } },
    // },
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
    privacySetting: '$privacySetting',
    privacySettingCustom: '$privacySettingCustom',
    profilePhotoPrivacy: '$profilePhotoPrivacy',
  };
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
              totalCriteria: 8, // Total number of fields you're matching
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
                  {
                    $cond: [
                      {
                        $and: [
                          { $gte: ['$userProfessional.currentSalary', userPartnerPreferences.income.min] },
                          { $lte: ['$userProfessional.currentSalary', userPartnerPreferences.income.max] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                  {
                    $cond: [{ $in: ['$address.currentCountry', userPartnerPreferences.country] }, 1, 0],
                  },
                  {
                    $cond: [{ $in: ['$address.state', userPartnerPreferences.state] }, 1, 0],
                  },
                  {
                    $cond: [{ $in: ['$address.currentCity', userPartnerPreferences.city] }, 1, 0],
                  },
                  {
                    $cond: [
                      {
                        $gt: [{ $size: { $setIntersection: ['$userPartnerDetails.diet', userPartnerPreferences.diet] } }, 0],
                      },
                      1,
                      0,
                    ],
                  },
                  {
                    $cond: [
                      {
                        $gt: [{ $size: { $setIntersection: ['$hobbies', userPartnerPreferences.hobbies] } }, 0],
                      },
                      1,
                      0,
                    ],
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
