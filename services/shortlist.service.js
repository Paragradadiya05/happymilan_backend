import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { Partner, Shortlist, User } from '../models';
import ApiError from '../utils/ApiError';
import { EnumStatusOfFriend } from '../models/enum.model';

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
  const { limit = 10, page = 1 } = options;
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
      $project: {
        _id: 1,
        age: 1,
        'user.height': 1,
        userId: 1,
        shortlistId: 1,
        createdAt: 1,
        updatedAt: 1,
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
        // 'user.userProfilePic': 1,
        'user.userProfileVideo': 1,
        'user.profileHideAndDelete': 1,
        'friendsDetails.status': 1,
        'friendsDetails._id': 1,
        matchPercentage: '$matchData.matchPercentage',
        matchedCriteria: '$matchData.matchedCriteria',
        'user.isUserActive': 1,
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

  return matchedUsers;
}
