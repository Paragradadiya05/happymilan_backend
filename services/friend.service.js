import ApiError from 'utils/ApiError';
import httpStatus from 'http-status';
import { Friend, Notification, User } from 'models';

import { EnumStatusOfFriend } from '../models/enum.model';

export async function getFriendById(id, options = {}) {
  const friend = await Friend.findById(id, options.projection, options)
    .populate({ path: 'user', select: 'name profilePic' })
    .populate({ path: 'friend', select: 'name profilePic' })
    .exec();
  return friend;
}

export async function getOne(query, options = {}) {
  const friend = await Friend.findOne(query, options.projection, options)
    .populate({ path: 'user', select: 'name profilePic' })
    .populate({ path: 'friend', select: 'name profilePic' })
    .exec();
  return friend;
}

export async function getFriendList(filter, options = {}) {
  const friend = await Friend.find(filter, options.projection, options)
    .populate({ path: 'user', select: 'name profilePic' })
    .populate({ path: 'friend', select: 'name profilePic' })
    .exec();
  return friend;
}

export async function getFriendListWithPagination(filter, options = {}) {
  const friend = await Friend.paginate(filter, options);
  return friend;
}

export async function createFriend(body = {}, user) {
  const userId = body.user.toString();
  const friend = body.friend.toString();

  // eslint-disable-next-line no-param-reassign
  body.status = EnumStatusOfFriend.REQUESTED;
  if (userId === friend) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'you cannot send friend request to yourself');
  }
  if (!(await User.findById(friend))) {
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
    getExistingFriendOrNot.status === EnumStatusOfFriend.REJECTED
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
    await Notification.create({ userId: body.user, otherUserId: body.friend, body: 'Request sent' });
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

  await Notification.create({ userId: body.user, otherUserId: body.friend, body: 'Request sent' });
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

export async function respondFriendRequest(request, status, user = {}) {
  const friendRequest = await Friend.findOne({ _id: request, friend: user });
  if (!friendRequest) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No such Friend Request');
  } else {
    if (friendRequest.status === status) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Friend request is already ${status}`);
    }
    if (status === 'accepted') {
      await Notification.create({ userId: user, body: `Friend request accepted` });
    }

    return Friend.findByIdAndUpdate(request, {
      $set: { status, lastInitiatorUser: user },
      $push: { statusHistory: { status, initiatorUser: user } },
    });
  }
}
