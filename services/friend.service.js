import ApiError from 'utils/ApiError';
import httpStatus from 'http-status';
import { Friend, Notification, Partner, User } from 'models';
import mongoose from 'mongoose';
import { EnumOfNotification, EnumStatusOfFriend } from '../models/enum.model';
import { sendNotification } from './notification.service';

async function calculateMatchScore(friendId, userPartnerPreferences) {
  const matchData = await User.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(friendId) },
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
        localField: '_id',
        foreignField: 'shortlistId',
        as: 'shortlistData',
      },
    },
    {
      $project: {
        matchPercentage: '$matchData.matchPercentage',
        matchedCriteria: '$matchData.matchedCriteria',
        shortlistData: 1,
      },
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

export async function getFriendList(filter, options = {}) {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  // Get total count of matching friends for pagination
  const totalDocs = await Friend.countDocuments(filter);

  // Retrieve paginated list of friends
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

  // Process each friend to calculate match data
  const friendsWithMatchData = await Promise.all(
    friends.map(async (friendEntry) => {
      const { friend, user } = friendEntry;
      if (user && user.userPartner) {
        const matchInfo = await calculateMatchScore(friend._id, user.userPartner);

        // Attach match data directly to the friend object
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
        $set: { status: EnumStatusOfFriend.REQUESTED, friend: body.friend, user: body.user, lastInitiatorUser: user },
        $push: { statusHistory: { status: EnumStatusOfFriend.REQUESTED, initiatorUser: user } },
      },
      { new: true }
    );
    const createNotificationForUser = await Notification.create({
      userId: body.user,
      otherUserId: body.friend,
      body: EnumOfNotification.REQUEST_SENT,
    });
    // send notification
    // check if usr hase deice token or not
    if (user.deviceTokens.length) {
      await user.deviceTokens.map(async (fcmToken) => {
        await sendNotification(fcmToken.deviceToken, {
          data: {
            _id: createNotificationForUser._id.toString(),
            userId: createNotificationForUser.userId.toString(),
            otherUserId: createNotificationForUser.otherUserId.toString(),
            body: `${EnumOfNotification.REQUEST_SENT} to ${getFrdUser.name}`, // parag send friend request.
            title: EnumOfNotification.REQUEST_SENT,
          },
        });
      });
    }

    // after creating Notification we need to send firebase noti. to user
    const createNotificationForReceiver = await Notification.create({
      userId: body.user,
      otherUserId: body.friend,
      body: EnumOfNotification.REQUEST_RECEIVED,
    });

    if (getFrdUser.deviceTokens.length) {
      await getFrdUser.deviceTokens.map(async (fcmToken) => {
        await sendNotification(fcmToken.deviceToken, {
          data: {
            _id: createNotificationForReceiver._id.toString(),
            userId: createNotificationForReceiver.userId.toString(),
            otherUserId: createNotificationForReceiver.otherUserId.toString(),
            body: `${EnumOfNotification.REQUEST_RECEIVED} from ${user.name}`,
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

  const createNotificationForUser = await Notification.create({
    userId: body.user,
    otherUserId: body.friend,
    body: EnumOfNotification.REQUEST_SENT,
  });
  if (user.deviceTokens.length) {
    await user.deviceTokens.map(async (fcmToken) => {
      await sendNotification(
        fcmToken.deviceToken,
        {
          data: {
            _id: createNotificationForUser._id.toString(),
            userId: createNotificationForUser.userId.toString(),
            otherUserId: createNotificationForUser.otherUserId.toString(),
            body: `${EnumOfNotification.REQUEST_SENT} to ${getFrdUser.name}`,
            title: EnumOfNotification.REQUEST_SENT,
          },
        },
        {}
      );
    });
  }

  const createNotificationForReceiver = await Notification.create({
    otherUserId: body.user,
    userId: body.friend,
    body: EnumOfNotification.REQUEST_RECEIVED,
  });
  if (getFrdUser.deviceTokens.length) {
    await getFrdUser.deviceTokens.map(async (fcmToken) => {
      await sendNotification(fcmToken.deviceToken, {
        data: {
          _id: createNotificationForReceiver._id.toString(),
          userId: createNotificationForReceiver.userId.toString(),
          otherUserId: createNotificationForReceiver.otherUserId.toString(),
          body: `${EnumOfNotification.REQUEST_RECEIVED} from ${user.name}`,
          title: EnumOfNotification.REQUEST_RECEIVED,
          createdAt: createNotificationForReceiver.createdAt.toString(),
          updatedAt: createNotificationForReceiver.updatedAt.toString(),
        },
      });
    });
  }
  return Friend.create({
    ...body,
    lastInitiatorUser: user,
    $push: { statusHistory: { status: EnumStatusOfFriend.REQUESTED, initiatorUser: user } },
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
  const user = await User.findById(userId, appUsesType);

  // Check if user is found
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }
  const friendRequest = await Friend.findOne({ _id: request, friend: user });
  if (!friendRequest) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No such Friend Request');
  } else {
    if (friendRequest.status === status) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Friend request is already ${status}`);
    }
    if (status === 'accepted') {
      // await Notification.create({ userId: user, body: `Friend request accepted` });
      const createNotificationForAccepted = await Notification.create({
        userId: user._id,
        body: EnumOfNotification.REQUEST_ACCEPTED,
      });

      const frdUserData = await User.findById(friendRequest.user);

      // send notification
      // check if usr hase deice token or not
      if (frdUserData && frdUserData.deviceTokens && frdUserData.deviceTokens.length) {
        await frdUserData.deviceTokens.map(async (fcmToken) => {
          await sendNotification(
            fcmToken.deviceToken,
            {
              data: {
                _id: createNotificationForAccepted._id.toString(),
                userId: createNotificationForAccepted.userId.toString(),
                body: `${EnumOfNotification.REQUEST_ACCEPTED} of ${frdUserData.name}`,
                title: EnumOfNotification.REQUEST_ACCEPTED,
                createdAt: createNotificationForAccepted.createdAt.toString(),
                updatedAt: createNotificationForAccepted.updatedAt.toString(),
              },
            },
            {}
          );
        });
      }
    }
    return Friend.findByIdAndUpdate(request, {
      $set: { status, lastInitiatorUser: user },
      $push: { statusHistory: { status, initiatorUser: user } },
    });
  }
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

  // Get user partner preferences for match score
  const userPartnerPreferences = await Partner.findOne({ userId });

  if (!userPartnerPreferences) {
    throw new Error('User Partner Preferences not found');
  }

  // Iterate over each friend to calculate the match score
  const friendsWithMatchData = await Promise.all(
    friends.map(async (friendEntry) => {
      const { friend, user } = friendEntry;
      if (user && user.userPartner) {
        const matchInfo = await calculateMatchScore(friend._id, user.userPartner);
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
