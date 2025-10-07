import ApiError from 'utils/ApiError';
import httpStatus from 'http-status';
import { CreditHistory, Friend, Notification, User } from 'models';
import mongoose from 'mongoose';
import { EnumOfNotification, EnumOfUserPlan, EnumStatusOfFriend } from '../models/enum.model';
import { sendNotification } from './notification.service';
import { creditService, userPlanService } from './index';
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
              matchedFields: {
                $map: {
                  input: [
                    {
                      field: 'age',
                      value: '$age',
                      expected: {
                        min: {
                          $ifNull: [{ $arrayElemAt: ['$userPartnerDetails.age.min', 0] }, '$userPartnerDetails.age.min'],
                        },
                        max: {
                          $ifNull: [{ $arrayElemAt: ['$userPartnerDetails.age.max', 0] }, '$userPartnerDetails.age.max'],
                        },
                      },
                    },
                    {
                      field: 'height',
                      value: '$height',
                      expected: {
                        min: {
                          $ifNull: [
                            { $arrayElemAt: ['$userPartnerDetails.height.min', 0] },
                            '$userPartnerDetails.height.min',
                          ],
                        },
                        max: {
                          $ifNull: [
                            { $arrayElemAt: ['$userPartnerDetails.height.max', 0] },
                            '$userPartnerDetails.height.max',
                          ],
                        },
                      },
                    },
                    {
                      field: 'income',
                      value: '$userProfessional.currentSalary',
                      expected: {
                        min: {
                          $ifNull: [
                            { $arrayElemAt: ['$userPartnerDetails.income.min', 0] },
                            '$userPartnerDetails.income.min',
                          ],
                        },
                        max: {
                          $ifNull: [
                            { $arrayElemAt: ['$userPartnerDetails.income.max', 0] },
                            '$userPartnerDetails.income.max',
                          ],
                        },
                      },
                    },
                    {
                      field: 'currentCountry',
                      value: '$address.currentCountry',
                      expected: {
                        $cond: [
                          {
                            $and: [
                              { $isArray: '$userPartnerDetails.country' },
                              { $eq: [{ $type: { $arrayElemAt: ['$userPartnerDetails.country', 0] } }, 'array'] },
                            ],
                          },
                          { $arrayElemAt: ['$userPartnerDetails.country', 0] },
                          { $ifNull: ['$userPartnerDetails.country', []] },
                        ],
                      },
                    },
                    {
                      field: 'currentState',
                      value: '$address.state',
                      expected: {
                        $cond: [
                          {
                            $and: [
                              { $isArray: '$userPartnerDetails.state' },
                              { $eq: [{ $type: { $arrayElemAt: ['$userPartnerDetails.state', 0] } }, 'array'] },
                            ],
                          },
                          { $arrayElemAt: ['$userPartnerDetails.state', 0] },
                          { $ifNull: ['$userPartnerDetails.state', []] },
                        ],
                      },
                    },
                    {
                      field: 'currentCity',
                      value: '$address.currentCity',
                      expected: {
                        $cond: [
                          {
                            $and: [
                              { $isArray: '$userPartnerDetails.city' },
                              { $eq: [{ $type: { $arrayElemAt: ['$userPartnerDetails.city', 0] } }, 'array'] },
                            ],
                          },
                          { $arrayElemAt: ['$userPartnerDetails.city', 0] },
                          { $ifNull: ['$userPartnerDetails.city', []] },
                        ],
                      },
                    },
                    {
                      field: 'diet',
                      value: {
                        $cond: [
                          {
                            $and: [{ $isArray: '$diet' }, { $eq: [{ $type: { $arrayElemAt: ['$diet', 0] } }, 'array'] }],
                          },
                          { $arrayElemAt: ['$diet', 0] }, // unwrap [["reading","cooking"]] → ["reading","cooking"]
                          { $ifNull: ['$diet', []] },
                        ],
                      },
                      expected: {
                        $cond: [
                          {
                            $and: [
                              { $isArray: '$userPartnerDetails.diet' },
                              { $eq: [{ $type: { $arrayElemAt: ['$userPartnerDetails.diet', 0] } }, 'array'] },
                            ],
                          },
                          { $arrayElemAt: ['$userPartnerDetails.diet', 0] },
                          { $ifNull: ['$userPartnerDetails.diet', []] },
                        ],
                      },
                    },

                    {
                      field: 'hobbies',
                      value: {
                        $cond: [
                          {
                            $and: [
                              { $isArray: '$hobbies' },
                              { $eq: [{ $type: { $arrayElemAt: ['$hobbies', 0] } }, 'array'] },
                            ],
                          },
                          { $arrayElemAt: ['$hobbies', 0] }, // unwrap [["reading","cooking"]] → ["reading","cooking"]
                          { $ifNull: ['$hobbies', []] },
                        ],
                      },
                      expected: {
                        $cond: [
                          {
                            $and: [
                              { $isArray: '$userPartnerDetails.hobbies' },
                              { $eq: [{ $type: { $arrayElemAt: ['$userPartnerDetails.hobbies', 0] } }, 'array'] },
                            ],
                          },
                          { $arrayElemAt: ['$userPartnerDetails.hobbies', 0] },
                          { $ifNull: ['$userPartnerDetails.hobbies', []] },
                        ],
                      },
                    },
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
              matchedCriteria: {
                $size: {
                  $filter: {
                    input: '$$matchedFields',
                    as: 'm',
                    cond: { $eq: ['$$m.isMatched', true] },
                  },
                },
              },
              matchPercentage: {
                $multiply: [
                  {
                    $divide: [
                      {
                        $size: {
                          $filter: {
                            input: '$$matchedFields',
                            as: 'm',
                            cond: { $eq: ['$$m.isMatched', true] },
                          },
                        },
                      },
                      8,
                    ],
                  },
                  100,
                ],
              },
            },
          },
        },
      },
    },
    {
      $addFields: {
        matchPercentage: '$matchData.matchPercentage',
      },
    },
    {
      $sort: { matchPercentage: -1 },
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

  const totalDocs = await Friend.countDocuments(filter);
  const isPremiumUser = await checkUserPremiumStatus(userId);

  // Step 1: Get friends with populated user and friend info
  const friends = await Friend.find(filter, options.projection, { ...options, limit, skip })
    .populate({
      path: 'friend',
      select:
        'privacySetting name email userUniqueId userProfilePic privacySettingCustom datingData appUsesType dateOfBirth firstName lastName caste gender height maritalStatus ' +
        'religion weight writeBoutYourSelf homeMobileNumber mobileNumber profilePic profileHideAndDelete hobbies',
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
        'privacySetting name email userUniqueId userProfilePic privacySettingCustom datingData appUsesType dateOfBirth firstName lastName caste gender height maritalStatus ' +
        'religion weight writeBoutYourSelf homeMobileNumber mobileNumber profilePic profileHideAndDelete hobbies',
      populate: [
        { path: 'address', select: 'userId currentCountry currentState currentCity' },
        { path: 'userEducation', select: 'degree collage city country state' },
        { path: 'userPartner' },
        { path: 'userProfessional', select: 'jobTitle jobType companyName currentSalary workCity workCountry' },
      ],
    })
    .exec();

  // Step 2: Filter out profiles that are hidden or deleted
  const visibleFriends = friends.filter((entry) => {
    const friendProfile = entry.friend.profileHideAndDelete || [];
    const userProfile = entry.user.profileHideAndDelete || [];

    const isFriendVisible = !friendProfile.some((p) => p.isProfileHide || p.isProfileDelete);
    const isUserVisible = !userProfile.some((p) => p.isProfileHide || p.isProfileDelete);

    return isFriendVisible && isUserVisible;
  });

  // Step 3: Attach match info
  const friendsWithMatchData = await Promise.all(
    visibleFriends.map(async (friendEntry) => {
      const { friend, user } = friendEntry;
      if (user && user.userPartner) {
        let friendId = friend._id;
        let userPartnerData = user.userPartner;
        let isFriendData = true;

        if (userId.toString() === friend._id.toString()) {
          friendId = user._id;
          userPartnerData = friend.userPartner;
          isFriendData = true;
        }
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

        return {
          ...friendEntry.toObject(),
          matchPercentage: matchInfo.matchPercentage,
          matchedCriteria: matchInfo.matchedCriteria,
          userShortListDetails: matchInfo.userShortListDetails,
        };
      }

      return {
        ...friendEntry.toObject(),
        friend: {
          ...friendEntry.friend.toObject(),
          matchPercentage: 0,
          matchedCriteria: [],
          userShortListDetails: [],
        },
      };
    })
  );

  const totalPages = Math.ceil(totalDocs / limit);

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
      screen: 'Alerts',
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
            screen: 'Alerts',
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
  if (appUsesType === 'dating') {
    const FRIEND_REQUEST_COST = 1; // e.g. 1 credit per request
    const totalRequestsSent = await Friend.countDocuments({ user: userId });

    // Only check/deduct after 2 free requests
    if (totalRequestsSent >= 2) {
      const hasEnoughCredits = await creditService.hasSufficientCredits(userId, FRIEND_REQUEST_COST);
      if (!hasEnoughCredits) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Insufficient credits. You need ${FRIEND_REQUEST_COST} credit(s) to send a friend request.`
        );
      }
      await creditService.deductCredits({
        userId,
        amount: FRIEND_REQUEST_COST,
        reason: 'Sent Friend Request',
        notes: `Deducted ${FRIEND_REQUEST_COST} credit(s) to send a friend request to user ${friend}.`,
      });
      // eslint-disable-next-line no-param-reassign
      body.creditDeducted = true;
    }
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
  console.log('=====xx====>', friendRequest.status);
  const frdUserData = await User.findById(friendRequest.user); // sender of original request
  if (
    [EnumStatusOfFriend.REJECTED, EnumStatusOfFriend.REMOVED].includes(status) &&
    appUsesType === 'dating' &&
    friendRequest.creditDeducted
  ) {
    const FRIEND_REQUEST_COST = 1;
    const refund = await creditService.addCredits({
      userId: friendRequest.user,
      amount: FRIEND_REQUEST_COST,
      reason: 'Friend Request Rejected/Removed',
      notes: `Refunded ${FRIEND_REQUEST_COST} credit(s) as the friend request was ${status}.`,
    });
    console.log('=====refund====>', refund);
    await CreditHistory.create({
      creditId: refund._id,
      userId: friendRequest.user,
      transactionType: 'credit',
      amount: FRIEND_REQUEST_COST,
      reason: `Friend Request ${status}`,
      balanceAfterTransaction: refund.creditBalance,
      notes: `Refunded credits as ${user.name} ${status} your friend request.`,
    });
  }
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
      screen: 'Alerts',
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
                body: `${user.name || 'Someone'} ${EnumOfNotification.REQUEST_ACCEPTED}`,
                createdAt: notification.createdAt.toISOString(),
                updatedAt: notification.updatedAt.toISOString(),
                screen: 'Alerts',
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
          screen: 'Alerts',
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
                  body: `${user.name || 'Someone'} ${EnumOfNotification.REQUEST_DECLINED}`,
                  createdAt: notification.createdAt.toISOString(),
                  updatedAt: notification.updatedAt.toISOString(),
                  screen: 'Alerts',
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
      screen: 'Alerts',
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

export async function getBlock(filter, options = {}, userId) {
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const strictFilter = {
    ...filter,
    user: userId,
  };

  const totalDocs = await Friend.countDocuments(strictFilter);

  const friends = await Friend.find(strictFilter, options.projection, {
    ...options,
    limit,
    skip,
  })
    .populate({
      path: 'friend',
      populate: [{ path: 'address' }, { path: 'userEducation' }, { path: 'userPartner' }, { path: 'userProfessional' }],
    })
    .populate({
      path: 'user',
      populate: [{ path: 'address' }, { path: 'userEducation' }, { path: 'userPartner' }, { path: 'userProfessional' }],
    })
    .lean()
    .exec();

  const isPremiumUser = await checkUserPremiumStatus(userId);

  const friendsWithMatchData = (
    await Promise.all(
      friends.map(async (friendEntry) => {
        const { friend, user } = friendEntry;

        if (!friend || !user) return null;

        // Default fallback preferences
        const defaultPartnerPrefs = {
          age: { min: 18, max: 100 },
          height: { min: 100, max: 250 },
          country: [],
          city: [],
        };

        // Determine match target and preferences
        let friendId = friend._id;
        let userPartnerData = user.userPartner || {};

        if (userId.toString() === friend._id.toString()) {
          friendId = user._id;
          userPartnerData = friend.userPartner || {};
        }

        // Merge real data with safe defaults
        const mergedPartnerPrefs = {
          age: {
            min:
              userPartnerData && userPartnerData.age && userPartnerData.age.min !== undefined
                ? userPartnerData.age.min
                : defaultPartnerPrefs.age.min,
            max:
              userPartnerData && userPartnerData.age && userPartnerData.age.max !== undefined
                ? userPartnerData.age.max
                : defaultPartnerPrefs.age.max,
          },
          height: {
            min:
              userPartnerData && userPartnerData.height && userPartnerData.height.min !== undefined
                ? userPartnerData.height.min
                : defaultPartnerPrefs.height.min,
            max:
              userPartnerData && userPartnerData.height && userPartnerData.height.max !== undefined
                ? userPartnerData.height.max
                : defaultPartnerPrefs.height.max,
          },
          country: Array.isArray(userPartnerData && userPartnerData.country)
            ? userPartnerData.country
            : defaultPartnerPrefs.country,
          city: Array.isArray(userPartnerData && userPartnerData.city) ? userPartnerData.city : defaultPartnerPrefs.city,
        };

        const matchInfo = await calculateMatchScore(friendId, mergedPartnerPrefs, userId, isPremiumUser);

        return {
          ...friendEntry,
          friend: {
            ...friend,
            matchPercentage: matchInfo.matchPercentage,
            matchedCriteria: matchInfo.matchedCriteria,
            shortlistData: matchInfo.shortlistData,
          },
        };
      })
    )
  ).filter(Boolean); // remove nulls

  const totalPages = Math.ceil(totalDocs / limit);

  return {
    results: friendsWithMatchData,
    totalDocs,
    limit,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    currentPage: page,
  };
}

export async function blockUser(body = {}, user) {
  const userId = body.user.toString();
  const friendId = body.friend.toString();

  if (userId === friendId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You cannot block yourself');
  }

  // Check if friend exists
  const getFrdUser = await User.findById(friendId);
  if (!getFrdUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No such user exists');
  }

  // Look for an existing friendship in any direction
  const existingFriend = await Friend.findOne({
    $or: [
      { user: userId, friend: friendId },
      { user: friendId, friend: userId },
    ],
  });

  let result;

  if (existingFriend) {
    if (existingFriend.status === EnumStatusOfFriend.BLOCKED) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'User is already blocked');
    }

    // Update status to BLOCKED and force user/friend to match request body
    result = await Friend.findByIdAndUpdate(
      existingFriend._id,
      {
        $set: {
          user: userId, // ✅ forcefully set as in body
          friend: friendId,
          status: EnumStatusOfFriend.BLOCKED,
          lastInitiatorUser: user,
          date: Date.now(),
        },
        $push: {
          statusHistory: {
            status: EnumStatusOfFriend.BLOCKED,
            initiatorUser: user,
            date: Date.now(),
          },
        },
      },
      { new: true }
    );
  } else {
    // No existing relationship — create new
    result = await Friend.create({
      user: userId,
      friend: friendId,
      status: EnumStatusOfFriend.BLOCKED,
      lastInitiatorUser: user,
      date: Date.now(),
      statusHistory: [
        {
          status: EnumStatusOfFriend.BLOCKED,
          initiatorUser: user,
          date: Date.now(),
        },
      ],
    });
  }

  return result;
}
export async function getFriendAcceptedMobile(filter, options = {}, userId, isSocket = false, checkUserActivePlan = false) {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  // await Friend.countDocuments(filter); // Optional: can be removed if not used

  let isPremiumUser = false;
  if (isSocket) {
    isPremiumUser = checkUserActivePlan;
  } else {
    isPremiumUser = await checkUserPremiumStatus(userId);
  }

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

      // ✅ Step 1: Check if either profile is hidden or deleted safely
      const friendProfile = Array.isArray(friend.profileHideAndDelete) ? friend.profileHideAndDelete : [];
      const userProfile = Array.isArray(user.profileHideAndDelete) ? user.profileHideAndDelete : [];

      const isFriendVisible = !friendProfile.some((p) => p.isProfileHide || p.isProfileDelete);
      const isUserVisible = !userProfile.some((p) => p.isProfileHide || p.isProfileDelete);

      if (!isFriendVisible || !isUserVisible) {
        return null; // ❌ Skip hidden/deleted profiles
      }

      // ✅ Step 2: Privacy check
      let friendList = friend;
      let isFriendData = true;

      if (userId.toString() === friend._id.toString()) {
        friendList = user;
        isFriendData = false;
      }

      const { privacySetting, privacySettingCustom = {} } = friendList;

      if (
        privacySetting === 'private' &&
        !(Array.isArray(privacySettingCustom.privateProfile) && privacySettingCustom.privateProfile.includes(userId))
      ) {
        return null; // ❌ Skip private profile if not allowed
      }

      // ✅ Step 3: Attach match info
      if (friendList.userPartner) {
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

      // Default if no match info available
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

  const filteredResults = friendsWithMatchData.filter(Boolean); // remove nulls
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
