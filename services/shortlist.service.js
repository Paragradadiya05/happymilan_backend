import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { Partner, Shortlist, User } from '../models';
import ApiError from '../utils/ApiError';
import { EnumStatusOfFriend } from '../models/enum.model';
import { calculateMatchScore, checkUserPremiumStatus } from './friend.service';

export async function createshortList(body = {}) {
  const { userId, shortlistId } = body;

  if (!User.findOne(body.shortlistId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'no such user exists');
  }
  if (userId.toString() === body.shortlistId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'not add self in shortliat');
  }
  const existingShortlist = await Shortlist.findOne({ userId, shortlistId });
  if (existingShortlist) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User is already in the shortlist');
  }
  // todo : add condition for redundant data
  return Shortlist.create({
    userId,
    shortlistId: body.shortlistId,
  });
}
export async function getShortlist(filter, options = {}) {
  const user = await Shortlist.find(filter, options.projection, options);
  return user;
}

export async function removeshotylist(filter = {}) {
  const user = await Shortlist.findOneAndRemove(filter);
  return user;
}

export async function getshortListWithPagination(filter, options = {}) {
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
        userId: mongoose.Types.ObjectId(filter.userId), // find the current user
        profileHideAndDelete: {
          $not: {
            $elemMatch: {
              $or: [{ isProfileHide: true }, { isProfileDelete: true }],
            },
          },
        },
      },
    },
    {
      $lookup: {
        from: 'User',
        localField: 'shortlistId',
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
    {
      $lookup: {
        from: 'Subscription',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$user', '$$userId'] },
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
        from: 'likes', // Collection name for likes
        let: { shortlistUserId: '$shortlistId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$user', mongoose.Types.ObjectId(filter.userId)] }, // Logged-in user's ID
                  { $eq: ['$likedUserId', '$$shortlistUserId'] }, // Liked user ID matches shortlistId
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
        from: 'Friend', // Collection name for friends
        let: { shortlistUserId: '$shortlistId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$user', mongoose.Types.ObjectId(filter.userId)] }, // Logged-in user's ID
                  { $eq: ['$friend', '$$shortlistUserId'] }, // Friend ID matches shortlistId
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
      $project: {
        _id: 1,
        age: 1,
        'user.height': 1,
        userId: 1,
        shortlistId: 1,
        createdAt: 1,
        updatedAt: 1,
        'user._id': 1,
        'address._id': 1,
        'address.currentResidenceAddress': 1,
        'address.currentCity': 1,
        'address.state': 1,
        'address.currentCountry': 1,
        'address.createdAt': 1,
        'address.updatedAt': 1,
        'user.name': 1,
        'user.appUsesType': 1,
        'user.email': 1,
        'user.mobileNumber': 1,
        'user.emailVerified': 1,
        'user.maritalStatus': 1,
        'user.displayName': 1,
        'user.firstName': 1,
        'user.lastName': 1,
        'user.gender': 1,
        'user.dateOfBirth': 1,
        'user.randomId': 1,
        'user.birthTime': 1,
        'user.religion': 1,
        'user.cast': 1,
        'user.hobbies': 1,
        'user.interest': 1,
        'user.homeMobileNumber': 1,
        'user.creatingProfileFor': 1,
        'user.writeBoutYourSelf': 1,
        'user.hideProfileDuration': 1,
        'user.community': 1,
        'user.motherTongue': 1,
        'user.weight': 1,
        'user.userEducation': 1,
        'userProfessional._id': 1,
        'userProfessional.jobTitle': 1,
        'userProfessional.jobType': 1,
        'userProfessional.companyName': 1,
        'userProfessional.currentSalary': 1,
        'userProfessional.workCity': 1,
        'userProfessional.workCountry': 1,
        'user.profilePic': 1,
        'user.userUniqueId': 1,
        'user.diet': 1,
        'user.userProfilePic': 1,
        'user.userProfileVideo': 1,
        'user.profileHideAndDelete': 1,
        'friendsDetails.status': 1,
        'friendsDetails._id': 1,
        'user.isUserActive': 1,
        'userLikeDetails.isLike': 1,
        'userLikeDetails.user': 1,
        'userLikeDetails.likedUserId': 1,
        'userLikeDetails._id': 1,
        'userShortListDetails.userId': 1,
        'userShortListDetails.shortlistId': 1,
        'userShortListDetails._id': 1,
        'subscriptionDetails.status': 1,
        'subscriptionDetails._id': 1,
        userPartnerDetails: 1,
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
  const matchedUsers = await Shortlist.aggregate(pipeline).exec();
  // console.log('matched user == ', matchedUsers[0].paginatedResults[0].user);
  const isPremiumUser = await checkUserPremiumStatus(filter.userId);

  await Promise.all(
    matchedUsers[0].paginatedResults.map(async (userData) => {
      const matchInfo = await calculateMatchScore(
        userData.shortlistId,
        userPartnerPreferences,
        userData.userId,
        isPremiumUser
      );
      // eslint-disable-next-line no-param-reassign
      userData.matchPercentage = matchInfo.matchPercentage;
      // eslint-disable-next-line no-param-reassign
      userData.matchedCriteria = matchInfo.matchedCriteria;

      // remove fields from here
      delete matchInfo.userLikeDetails;
      delete matchInfo.friendsDetails;
      delete matchInfo.defaultFields;
      delete matchInfo.matchPercentage;
      delete matchInfo.matchedCriteria;
      delete matchInfo.userShortListDetails;
      // eslint-disable-next-line no-param-reassign
      userData.user = matchInfo;
    })
  );

  return matchedUsers;
}

export async function getshortListforMobile(filter, options = {}) {
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
        userId: mongoose.Types.ObjectId(filter.userId), // find the current user
      },
    },
    {
      $lookup: {
        from: 'User',
        localField: 'shortlistId',
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
        localField: 'userId',
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
        localField: 'shortlistId',
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
        let: { shortlistUserId: '$shortlistId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$user', mongoose.Types.ObjectId(filter.userId)] }, // Logged-in user's ID
                  { $eq: ['$likedUserId', '$$shortlistUserId'] }, // Liked user ID matches shortlistId
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
        from: 'Friend', // Collection name for friends
        let: { shortlistUserId: '$shortlistId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$user', mongoose.Types.ObjectId(filter.userId)] }, // Logged-in user's ID
                  { $eq: ['$friend', '$$shortlistUserId'] }, // Friend ID matches shortlistId
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
  const matchedUsers = await Shortlist.aggregate(pipeline).exec();
  const isPremiumUser = await checkUserPremiumStatus(filter.userId);

  await Promise.all(
    matchedUsers[0].paginatedResults.map(async (userData) => {
      const matchInfo = await calculateMatchScore(
        userData.shortlistId,
        userPartnerPreferences,
        userData.userId,
        isPremiumUser
      );
      // eslint-disable-next-line no-param-reassign
      userData.matchPercentage = matchInfo.matchPercentage;
      // eslint-disable-next-line no-param-reassign
      userData.matchedCriteria = matchInfo.matchedCriteria;

      // remove fields from here
      delete matchInfo.userLikeDetails;
      delete matchInfo.friendsDetails;
      delete matchInfo.defaultFields;
      delete matchInfo.matchPercentage;
      delete matchInfo.matchedCriteria;
      delete matchInfo.userShortListDetails;
      // eslint-disable-next-line no-param-reassign
      userData.friendList = matchInfo;
    })
  );
  return matchedUsers;
}
