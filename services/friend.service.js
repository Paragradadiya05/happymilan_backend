import ApiError from 'utils/ApiError';
import httpStatus from 'http-status';
import { Friend, Notification, User } from 'models';
import mongoose from 'mongoose';
import { EnumOfNotification, EnumOfUserPlan, EnumStatusOfFriend } from '../models/enum.model';
import { sendNotification } from './notification.service';
import { userPlanService } from './index';
import { createDynamicProjectionForPrivacySetting, defaultFields, fields } from '../utils/common';

export async function calculateMatchScore(friendId, userPartnerPreferences, userId, isPremiumUser = false) {
  const matchData = await User.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(friendId) },
    },
    // find address
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
    // Get Subscription Details
    {
      $lookup: {
        from: 'Subscription', // must match your model's collection name exactly
        let: { userId: '$_id' }, // friendId is current document (_id)
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$user', '$$userId'],
              },
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $limit: 1, // in case user has multiple subscriptions, get the latest
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
    // find UserProfessionalDetail
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
      $lookup: {
        from: 'shortlists',
        let: { currentUserIdForShortList: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$userId', mongoose.Types.ObjectId(userId)] },
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
        path: '$userShortListDetails', // Deconstructs the 'address' array field
        preserveNullAndEmptyArrays: true, // If you want to exclude documents with no address
      },
    },
    {
      $project: createDynamicProjectionForPrivacySetting(fields, defaultFields, isPremiumUser),
    },
  ]);

  return Array.isArray(matchData) && matchData.length > 0
    ? matchData[0]
    : {
        matchPercentage: 0,
        matchedCriteria: 0,
        shortlistData: [],
      };
}

export async function getFriendById(id, options = {}) {
  const friend = await Friend.findById(id, options.projection, options)
    .populate('address')
    .populate('user')
    .populate('friend')
    .exec();
  return friend;
}

export async function getOne(query, options = {}) {
  const friend = await Friend.findOne(query, options.projection, options)
    .populate('user')
    .populate('friend')
    .populate('address')
    .exec();
  return friend;
}

export async function checkUserPremiumStatus(userId) {
  const currentDate = new Date();
  try {
    const getUserPlanDetails = await userPlanService.getOne(
      {
        userId,
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate },
      },
      {}
    );

    let isPremiumUser = false;
    if (getUserPlanDetails && getUserPlanDetails.status) {
      isPremiumUser = getUserPlanDetails.status === EnumOfUserPlan.ACTIVE;
    }

    return isPremiumUser;
  } catch (error) {
    console.error('Error checking user premium status:', error);
    throw error;
  }
}

export async function getFriendList(filter, options = {}, userId) {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  // Get total count of matching friends for pagination
  const totalDocs = await Friend.countDocuments(filter);

  const isPremiumUser = await checkUserPremiumStatus(userId);
  // todo: use in all query and remove countDocuments paginate
  // Retrieve paginated list of friends
  const friends = await Friend.find(filter, options.projection, { ...options, limit, skip })
    .populate({
      path: 'friend',
      select:
        'privacySetting name email userUniqueId userProfilePic privacySettingCustom datingData appUsesType dateOfBirth firstName lastName caste gender height maritalStatus' +
        'religion weight writeBoutYourSelf homeMobileNumber mobileNumber profilePic',
      populate: [
        { path: 'address', select: 'userId currentCountry currentState currentCity' },
        { path: 'userEducation', select: 'degree collage city country state' },
        { path: 'userPartner' },
        { path: 'userProfessional', select: 'jobTitle jobType companyName currentSalary workCity workCountry' },
      ],
    })
    .populate({
      path: 'user',
      select:
        'privacySetting name email userUniqueId userProfilePic privacySettingCustom datingData appUsesType dateOfBirth firstName lastName caste gender height maritalStatus' +
        'religion weight writeBoutYourSelf homeMobileNumber mobileNumber profilePic',
      populate: [
        { path: 'address', select: 'userId currentCountry currentState currentCity' },
        { path: 'userEducation', select: 'degree collage city country state' },
        { path: 'userPartner' },
        { path: 'userProfessional', select: 'jobTitle jobType companyName currentSalary workCity workCountry' },
      ],
    })
    .exec();

  // Process each friend to calculate match data
  const friendsWithMatchData = await Promise.all(
    friends.map(async (friendEntry) => {
      const { friend, user } = friendEntry;
      if (user && user.userPartner) {
        /* we are fetching friend data.
         ( there are two possible thing
            1. current login user is friend
            2. current login user is user )

         if current login user is friend in data then we need to pass other user in calculateMatchScore function as friend id
         */

        let friendId = friend._id;
        let userPartnerData = user.userPartner;
        let isFriendData = true;

        if (userId.toString() === friend._id.toString()) {
          friendId = user._id;
          userPartnerData = friend.userPartner;
          isFriendData = true;
        }

        // we need to find friend privacySetting and privacySettingCustom for user
        // after we get privacySetting we need to find key for same and return that fields from friend data

        const matchInfo = await calculateMatchScore(friendId, userPartnerData, userId, isPremiumUser);

        if (isFriendData) {
          // eslint-disable-next-line no-param-reassign
          friendEntry.friend._doc = matchInfo;

          // eslint-disable-next-line no-param-reassign
          friendEntry.user = friend;
        } else {
          // eslint-disable-next-line no-param-reassign
          friendEntry.user = matchInfo;
          // eslint-disable-next-line no-param-reassign
          friendEntry.friend = user;
        }

        // Attach match data directly to the friend object
        return {
          ...friendEntry.toObject(),
          matchPercentage: matchInfo.matchPercentage,
          matchedCriteria: matchInfo.matchedCriteria,
          userShortListDetails: matchInfo.userShortListDetails,
        };
      }

      // If no match data is available, attach default values to the friend object
      return {
        ...friendEntry.toObject(),
        friend: {
          ...friend.toObject(),
          matchPercentage: 0,
          matchedCriteria: [],
          userShortListDetails: [],
        },
      };
    })
  );

  // Calculate total pages
  const totalPages = Math.ceil(totalDocs / limit);

  // Return paginated results with metadata
  return {
    results: friendsWithMatchData,
    totalDocs,
    limit,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export async function getFriendListWithPagination(filter, options = {}, appUsesType) {
  const friend = await Friend.paginate(filter, options, appUsesType);
  return friend;
}

export async function createFriend(body = {}, user, appUsesType) {
  const userId = body.user.toString();
  const friend = body.friend.toString();

  const getUser = await User.findOne({ _id: friend, appUsesType });
  if (!getUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'friend is not exists');
  }
  // eslint-disable-next-line no-param-reassign
  body.status = EnumStatusOfFriend.REQUESTED;
  if (userId === friend) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'you cannot send friend request to yourself');
  }
  const getFrdUser = await User.findById(friend);
  if (!getFrdUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'no such user exists');
  }
  let getExistingFriendOrNot = await Friend.findOne({
    $or: [
      { friend: body.friend, user: body.user },
      { friend: body.user, user: body.friend },
    ],
  });

  if (
    getExistingFriendOrNot &&
    getExistingFriendOrNot.status &&
    [EnumStatusOfFriend.REJECTED, EnumStatusOfFriend.REMOVED].includes(getExistingFriendOrNot.status)
  ) {
    getExistingFriendOrNot = await Friend.findOneAndUpdate(
      {
        $or: [
          { friend: body.friend, user: body.user },
          { friend: body.user, user: body.friend },
        ],
      },
      {
        $set: {
          status: EnumStatusOfFriend.REQUESTED,
          friend: body.friend,
          user: body.user,
          lastInitiatorUser: user,
          date: Date.now(),
        },
        $push: { statusHistory: { status: EnumStatusOfFriend.REQUESTED, initiatorUser: user, date: Date.now() } },
      },
      { new: true }
    );

    const createNotificationForReceiver = await Notification.create({
      userId: body.friend,
      otherUserId: body.user,
      body: EnumOfNotification.REQUEST_RECEIVED,
      title: EnumOfNotification.REQUEST_RECEIVED,
      reqId: getExistingFriendOrNot._id,
    });

    if (getFrdUser.deviceTokens.length) {
      await getFrdUser.deviceTokens.map(async (fcmToken) => {
        await sendNotification(fcmToken.deviceToken, {
          data: {
            _id: createNotificationForReceiver._id.toString(),
            userId: createNotificationForReceiver.userId.toString(),
            otherUserId: createNotificationForReceiver.otherUserId.toString(),
            body: `${user.name} ${EnumOfNotification.REQUEST_RECEIVED}`,
            title: EnumOfNotification.REQUEST_RECEIVED,
          },
        });
      });
    }
    return getExistingFriendOrNot;
  }
  if (getExistingFriendOrNot && !getExistingFriendOrNot.status === EnumStatusOfFriend.REQUESTED) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'user already friend');
  } else if (
    getExistingFriendOrNot &&
    [EnumStatusOfFriend.REQUESTED, EnumStatusOfFriend.ACCEPTED, EnumStatusOfFriend.BLOCKED].includes(
      getExistingFriendOrNot.status
    )
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'user already friend or friend request is already sent or user may blocked you'
    );
  }
  return Friend.create({
    ...body,
    lastInitiatorUser: user,
    date: Date.now(),
    $push: { statusHistory: { status: EnumStatusOfFriend.REQUESTED, initiatorUser: user, date: Date.now() } },
  });
}

export async function updateFriend(filter, body, options = {}) {
  const initiatorUserArr = body.statusHistory.map((item) => item.initiatorUser);
  const initiatorUser = await User.find({ _id: { $in: initiatorUserArr } });
  if (initiatorUser.length !== initiatorUserArr.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'initiatorUser of statusHistory some ids not valid');
  }
  const friend = await Friend.findOneAndUpdate(filter, body, options);
  return friend;
}

export async function updateManyFriend(filter, body, options = {}) {
  const friend = await Friend.updateMany(filter, body, options);
  return friend;
}

export async function removeFriend(filter) {
  const friend = await Friend.findOneAndRemove(filter);
  return friend;
}

export async function removeManyFriend(filter) {
  const friend = await Friend.deleteMany(filter);
  return friend;
}

export async function aggregateFriend(query) {
  const friend = await Friend.aggregate(query);
  return friend;
}

export async function aggregateFriendWithPagination(query, options = {}) {
  const aggregate = Friend.aggregate();
  // eslint-disable-next-line
  query.map((obj) => {
    // eslint-disable-next-line
    aggregate._pipeline.push(obj);
  });
  const friend = await Friend.aggregatePaginate(aggregate, options);
  return friend;
}

export async function respondFriendRequest(request, status, userId = {}, appUsesType) {
  const user = await User.findById(userId, appUsesType).select('+name');
  if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');

  const friendRequest = await Friend.findOne({ _id: request, friend: user });
  if (!friendRequest) throw new ApiError(httpStatus.BAD_REQUEST, 'No such Friend Request');

  if (friendRequest.status === EnumStatusOfFriend.BLOCKED && status !== EnumStatusOfFriend.REMOVED) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Cannot process the request. User is blocked.');
  }

  if (friendRequest.status === status) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Friend request is already ${status}`);
  }

  const frdUserData = await User.findById(friendRequest.user); // sender of original request
  console.log('=== User in friend request ===', user);
  if (status === 'accepted') {
    await Notification.findOneAndUpdate(
      {
        userId: user._id,
        otherUserId: friendRequest.user,
        title: 'Sent you a request',
      },
      {
        $set: {
          title: EnumOfNotification.REQUEST_ACCEPTED,
          body: EnumOfNotification.REQUEST_ACCEPTED,
        },
      },
      { new: true }
    );

    const notification = await Notification.create({
      userId: friendRequest.user, // sender
      otherUserId: user._id, // acceptor
      title: EnumOfNotification.REQUEST_ACCEPTED,
      body: `${user.name} ${EnumOfNotification.REQUEST_ACCEPTED}`,
    });

    if (frdUserData.deviceTokens.length) {
      await Promise.all(
        frdUserData.deviceTokens.map(async (fcmToken) => {
          try {
            await sendNotification(fcmToken.deviceToken, {
              data: {
                _id: notification._id.toString(),
                userId: notification.userId.toString(),
                otherUserId: notification.otherUserId.toString(),
                title: notification.title,
                body: `${user.name} ${EnumOfNotification.REQUEST_ACCEPTED}`,
                createdAt: notification.createdAt.toISOString(),
                updatedAt: notification.updatedAt.toISOString(),
              },
            });
          } catch (err) {
            if (err.code === 'messaging/registration-token-not-registered') {
              await User.updateOne(
                { _id: frdUserData._id },
                { $pull: { deviceTokens: { deviceToken: fcmToken.deviceToken } } }
              );
              console.warn(`Token removed: ${fcmToken.deviceToken}`);
            }
          }
        })
      );
    }
  }

  if (status === 'rejected') {
    const isReceiverRejecting = friendRequest.friend.toString() === user._id.toString();
    if (isReceiverRejecting) {
      const notification = await Notification.findOneAndUpdate(
        {
          userId: friendRequest.friend,
          otherUserId: friendRequest.user,
          title: 'Sent you a request',
        },
        {
          $set: {
            title: EnumOfNotification.REQUEST_DECLINED,
            body: EnumOfNotification.REQUEST_DECLINED,
          },
        },
        { new: true }
      );

      if (frdUserData.deviceTokens.length) {
        await Promise.all(
          frdUserData.deviceTokens.map(async (fcmToken) => {
            try {
              await sendNotification(fcmToken.deviceToken, {
                data: {
                  _id: notification._id.toString(),
                  userId: friendRequest.friend.toString(),
                  otherUserId: friendRequest.user.toString(),
                  title: EnumOfNotification.REQUEST_DECLINED,
                  body: `${user.name} ${EnumOfNotification.REQUEST_DECLINED}`,
                  createdAt: notification.createdAt.toISOString(),
                  updatedAt: notification.updatedAt.toISOString(),
                },
              });
            } catch (err) {
              if (err.code === 'messaging/registration-token-not-registered') {
                await User.updateOne(
                  { _id: frdUserData._id },
                  { $pull: { deviceTokens: { deviceToken: fcmToken.deviceToken } } }
                );
              }
            }
          })
        );
      }
    }
  }

  if (status === 'removed') {
    await Notification.deleteOne({
      userId: friendRequest.friend,
      otherUserId: friendRequest.user,
      title: 'Sent you a request',
    });
  }

  return Friend.findByIdAndUpdate(
    request,
    {
      $set: { status, lastInitiatorUser: user },
      $push: { statusHistory: { status, initiatorUser: user } },
    },
    { new: true }
  );
}

export async function getFriendv2(filter, options = {}, userId) {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  const totalDocs = await Friend.countDocuments(filter);
  const friends = await Friend.find(filter, options.projection, { ...options, limit, skip })
    .populate({
      path: 'friend',
      populate: [{ path: 'address' }, { path: 'userEducation' }, { path: 'userPartner' }, { path: 'userProfessional' }],
    })
    .populate({
      path: 'user',
      populate: [{ path: 'address' }, { path: 'userEducation' }, { path: 'userPartner' }, { path: 'userProfessional' }],
    })
    .exec();

  const isPremiumUser = await checkUserPremiumStatus(userId);

  // Get user partner preferences for match score
  // const userPartnerPreferences = await Partner.findOne({ userId });
  //
  // if (!userPartnerPreferences) {
  //   throw new Error('User Partner Preferences not found');
  // }

  // Iterate over each friend to calculate the match score
  const friendsWithMatchData = await Promise.all(
    friends.map(async (friendEntry) => {
      const { friend, user } = friendEntry;
      if (user && user.userPartner) {
        const matchInfo = await calculateMatchScore(friend._id, user.userPartner, userId, isPremiumUser);
        return {
          ...friendEntry.toObject(),
          friend: {
            ...friend.toObject(),
            matchPercentage: matchInfo.matchPercentage,
            matchedCriteria: matchInfo.matchedCriteria,
            shortlistData: matchInfo.shortlistData,
          },
        };
      }

      // If no match data is available, attach default values to the friend object
      return {
        ...friendEntry.toObject(),
        friend: {
          ...friend.toObject(),
          matchPercentage: 0,
          matchedCriteria: [],
          shortlistData: [],
        },
      };
    })
  );

  // Calculate total pages
  const totalPages = Math.ceil(totalDocs / limit);

  // Return paginated results with metadata
  return {
    results: friendsWithMatchData,
    totalDocs,
    limit,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

// Function to calculate match score for each friend
export async function getBlock(filter, options = {}, userId) {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  const totalDocs = await Friend.countDocuments(filter);
  const friends = await Friend.find(filter, options.projection, { ...options, limit, skip })
    .populate({
      path: 'friend',
      populate: [{ path: 'address' }, { path: 'userEducation' }, { path: 'userPartner' }, { path: 'userProfessional' }],
    })
    .populate({
      path: 'user',
      populate: [{ path: 'address' }, { path: 'userEducation' }, { path: 'userPartner' }, { path: 'userProfessional' }],
    })
    .lean() // Ensure results are plain JavaScript objects
    .exec();

  const isPremiumUser = await checkUserPremiumStatus(userId);

  // Get user partner preferences for match score
  // const userPartnerPreferences = await Partner.findOne({ userId });
  //
  // if (!userPartnerPreferences) {
  //   throw new Error('User Partner Preferences not found');
  // }

  // Iterate over each friend to calculate the match score
  const friendsWithMatchData = await Promise.all(
    friends.map(async (friendEntry) => {
      const { friend, user } = friendEntry;
      if (user && user.userPartner) {
        /* we are fetching friend data.
         ( there are two possible thing
            1. current login user is friend
            2. current login user is user )

         if current login user is friend in data then we need to pass other user in calculateMatchScore function as friend id
         */

        let friendId = friend._id;
        let userPartnerData = user.userPartner;

        if (userId.toString() === friend._id.toString()) {
          friendId = user._id;
          userPartnerData = friend.userPartner;
        }

        const matchInfo = await calculateMatchScore(friendId, userPartnerData, userId, isPremiumUser);
        return {
          ...friendEntry, // Already a plain object, no need for toObject()
          friend: {
            ...friend,
            matchPercentage: matchInfo.matchPercentage,
            matchedCriteria: matchInfo.matchedCriteria,
            shortlistData: matchInfo.shortlistData,
          },
        };
      }

      // Attach default values if no match data is available
      return {
        ...friendEntry,
        friend: {
          ...friend,
          matchPercentage: 0,
          matchedCriteria: [],
          shortlistData: [],
        },
      };
    })
  );

  // Calculate total pages
  const totalPages = Math.ceil(totalDocs / limit);

  // Return paginated results with metadata, including the current page
  return {
    results: friendsWithMatchData,
    totalDocs,
    limit,
    page, // Current page
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    currentPage: page, // Optional explicit field for current page
  };
}

export async function blockUser(body = {}, user) {
  const userId = body.user.toString();
  const friend = body.friend.toString();

  if (userId === friend) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You cannot block yourself');
  }

  const getFrdUser = await User.findById(friend);
  if (!getFrdUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No such user exists');
  }

  let getExistingFriendOrNot = await Friend.findOne({
    $or: [
      { friend: body.friend, user: body.user },
      { friend: body.user, user: body.friend },
    ],
  });

  if (getExistingFriendOrNot) {
    if (getExistingFriendOrNot.status === EnumStatusOfFriend.BLOCKED) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'User is already blocked');
    }

    getExistingFriendOrNot = await Friend.findOneAndUpdate(
      {
        $or: [
          { friend: body.friend, user: body.user },
          { friend: body.user, user: body.friend },
        ],
      },
      {
        $set: {
          status: EnumStatusOfFriend.BLOCKED,
          lastInitiatorUser: user,
          date: Date.now(),
        },
        $push: { statusHistory: { status: EnumStatusOfFriend.BLOCKED, initiatorUser: user, date: Date.now() } },
      },
      { new: true }
    );

    return getExistingFriendOrNot;
  }

  // If no existing relationship, create a new blocked entry
  return Friend.create({
    ...body,
    status: EnumStatusOfFriend.BLOCKED,
    lastInitiatorUser: user,
    date: Date.now(),
    statusHistory: [{ status: EnumStatusOfFriend.BLOCKED, initiatorUser: user, date: Date.now() }],
  });
}
export async function getFriendAcceptedMobile(filter, options = {}, userId) {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;
  await Friend.countDocuments(filter);
  const isPremiumUser = await checkUserPremiumStatus(userId);

  const friends = await Friend.find(filter, options.projection, { ...options, limit, skip })
    .populate({
      path: 'friend',
      populate: [{ path: 'address' }, { path: 'userEducation' }, { path: 'userPartner' }, { path: 'userProfessional' }],
    })
    .populate({
      path: 'user',
      populate: [{ path: 'address' }, { path: 'userEducation' }, { path: 'userPartner' }, { path: 'userProfessional' }],
    })
    .exec();

  const friendsWithMatchData = await Promise.all(
    friends.map(async (friendEntry) => {
      const { friend, user } = friendEntry;

      let friendList = friend;
      let isFriendData = true;

      if (userId.toString() === friend._id.toString()) {
        friendList = user;
        isFriendData = false;
      }

      const { privacySetting, privacySettingCustom = {} } = friendList;

      if (privacySetting === 'private' && !(privacySettingCustom.privateProfile || []).includes(userId)) {
        return null; // Skip this user if the logged-in user is not allowed
      }

      if (friendList && friendList.userPartner) {
        const matchInfo = await calculateMatchScore(friendList._id, friendList.userPartner, userId, isPremiumUser);

        if (isFriendData) {
          // eslint-disable-next-line no-param-reassign
          friendEntry.friend = matchInfo;
        } else {
          // eslint-disable-next-line no-param-reassign
          friendEntry.user = matchInfo;
        }

        return {
          ...friendEntry,
          matchPercentage: matchInfo.matchPercentage,
          matchedCriteria: matchInfo.matchedCriteria,
          userShortListDetails: matchInfo.userShortListDetails,
        };
      }
      return {
        ...friendEntry,
        friend: {
          ...friend,
          matchPercentage: 0,
          matchedCriteria: [],
          userShortListDetails: [],
        },
      };
    })
  );

  const filteredResults = friendsWithMatchData.filter(Boolean);
  const totalPages = Math.ceil(filteredResults.length / limit);

  return {
    results: filteredResults,
    totalDocs: filteredResults.length,
    limit,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
