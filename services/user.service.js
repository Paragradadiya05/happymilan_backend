import ApiError from 'utils/ApiError';
import httpStatus from 'http-status';
import { Partner, User } from 'models';
import _ from 'lodash';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import moment from 'moment';
import { notificationService } from './index';
import enumModel, { EnumGenderOfUsers, EnumOfPlatformType, EnumStatusOfFriend } from '../models/enum.model';

export async function getUserById(id, options = {}) {
  const user = await User.findById(id, options.projection, options);
  return user;
}
// todo:check populate in database
export async function getOne(query, options = {}) {
  const user = await User.findOne(query, options.projection, options)
    .populate('address')
    .populate('userPartner')
    .populate('userEducation')
    .populate('userProfessional')
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
    .populate('userProfessional');
  return user;
}

export async function getUserListForSearch(filter, { currentCountry = [], currentCity = [] }) {
  // eslint-disable-next-line no-param-reassign
  filter['profileHideAndDelete.isProfileHide'] = { $ne: true };
  const user = await User.aggregate([
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
  ]);
  return user;
}
export async function getUserListWithPagination(filter, options = {}) {
  const user = await User.paginate(filter, options);
  return user;
}

export async function createUser(body) {
  if (await User.isEmailTaken(body.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
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

export async function getGenderList(filter, options = {}) {
  const userData = await getOne(filter, {});

  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'user not found');
  }
  let oppositeGender;
  if (userData.gender === EnumGenderOfUsers.MALE) {
    oppositeGender = EnumGenderOfUsers.FEMALE;
  } else if (userData.gender === EnumGenderOfUsers.FEMALE) {
    oppositeGender = EnumGenderOfUsers.MALE;
  } else {
    throw new Error('Invalid gender for logged-in user');
  }
  const user = await User.find({ gender: oppositeGender }, options.projection, options)
    .populate('address')
    .populate('userEducation')
    .populate('userPartner')
    .populate('userProfessional');
  return user;
}

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

  const pipeline = [
    {
      $match: {
        _id: { $ne: mongoose.Types.ObjectId(filter.userId) }, // Exclude the current user
        platform: { $eq: EnumOfPlatformType.HAPPY_MILAN },
        gender: oppositeGender,
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
        userProfessional: 1,
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
      },
    },
    { $sort: { matchPercentage: -1 } }, // Sort by match percentage in descending order
    { $skip: (page - 1) * limit }, // Skip documents for pagination
    { $limit: limit }, // Limit the number of documents for pagination
  ];
  const matchedUsers = await User.aggregate(pipeline).exec();
  return matchedUsers;
}

export async function getMatchUser(filter) {
  const userPartnerPreferences = await Partner.findOne({ userId: filter.user });
  if (!userPartnerPreferences) {
    throw new Error('User Partner Preferences not found. Please add Partner Preference first');
  }
  const pipeline = [
    {
      $match: {
        _id: { $eq: mongoose.Types.ObjectId(filter.userId) }, // Exclude the current user
        platform: { $eq: EnumOfPlatformType.HAPPY_MILAN },
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
                $and: [{ $eq: ['$user', filter.user] }, { $eq: ['$friend', '$$currentUserId'] }],
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
        isUserActive: 1,
      },
    },
    { $sort: { matchPercentage: -1 } }, // Sort by match percentage in descending order
  ];
  const matchedUsers = await User.aggregate(pipeline).exec();
  return matchedUsers;
}

export async function getUserWithPartnerPrefScore(filter) {
  const userId = filter._id;
  const userPartnerPreferences = await Partner.findOne({ userId: filter.currentUserId });
  if (!userPartnerPreferences) {
    throw new Error('User Partner Preferences not found. Please add Partner Preference first');
  }
  const pipeline = [
    {
      $match: {
        _id: { $eq: mongoose.Types.ObjectId(userId) },
        platform: { $eq: EnumOfPlatformType.HAPPY_MILAN },
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
                $divide: [{ $subtract: [new Date(), '$dateOfBirth'] }, 31556952000],
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
    // Populate userPartner field
    {
      $lookup: {
        from: 'UserPartner',
        localField: '_id',
        foreignField: 'userId',
        as: 'userPartner',
      },
    },
    {
      $unwind: {
        path: '$userPartner',
        preserveNullAndEmptyArrays: true,
      },
    },
    // Populate userProfessional field
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
    // Populate userEducation field
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
        userProfessional: 1,
        userEducation: 1,
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
      },
    },
  ];
  const matchedUser = await User.aggregate(pipeline).exec();
  return matchedUser;
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
