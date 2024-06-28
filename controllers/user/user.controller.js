import httpStatus from 'http-status';
import { friendService, userService } from 'services';
import { catchAsync } from 'utils/catchAsync';
import { pick } from '../../utils/pick';
import { EnumStatusOfFriend } from '../../models/enum.model';
import ApiError from '../../utils/ApiError';
import { Subscription } from '../../models';

export const get = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const filter = {
    _id: userId,
  };
  const options = {};
  const user = await userService.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: user });
});

export const list = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const user = await userService.getUserList(filter, options);
  return res.status(httpStatus.OK).send({ results: user });
});

export const paginate = catchAsync(async (req, res) => {
  const { query } = req;
  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = {
    [sortingObj.sort]: sortingObj.order,
  };
  const filter = {};
  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
  };
  const user = await userService.getUserListWithPagination(filter, options);
  return res.status(httpStatus.OK).send({ results: user });
});

export const paginatedUserThatNotFriend = catchAsync(async (req, res) => {
  const { query } = req;
  const { user } = req;
  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = {
    [sortingObj.sort]: sortingObj.order,
  };
  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
  };
  const filter = {
    status: EnumStatusOfFriend.ACCEPTED,
    $or: [{ friend: user._id }, { user: user._id }],
  };
  const getFriend = await friendService.getFriendList(filter, options);
  const friendUserIds = getFriend.map((friend) => {
    if (friend.user.toString() !== user._id) {
      return friend.user;
    }
    return friend.friend;
  });
  const userData = await userService.getUserListWithPagination(
    { _id: { $nin: friendUserIds.map((data) => data._id) } },
    options
  );
  return res.status(httpStatus.OK).send({ results: userData });
});

export const create = catchAsync(async (req, res) => {
  const { body } = req;
  const options = {};
  const user = await userService.createUser(body, options);
  return res.status(httpStatus.CREATED).send({ results: user });
});

export const update = catchAsync(async (req, res) => {
  const { body } = req;
  const { userId } = req.params;
  const filter = {
    _id: userId,
  };
  const options = { new: true };
  const user = await userService.updateUser(filter, body, options);
  return res.status(httpStatus.OK).send({ results: user });
});

export const deleteUserImage = catchAsync(async (req, res) => {
  const { profileImageUrl, name } = req.body;
  const { userId } = req.params;
  const filter = {
    _id: userId,
  };

  const user = await userService.getOne(filter);

  if (user.profilePic === profileImageUrl) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'change profile pic first then you can able to delete this image');
  }

  let foundImage = false;
  const updatedProfilePic = user.userProfilePic.map((image) => {
    if (!image.isDeleted && image.url === profileImageUrl && image.name === name) {
      // eslint-disable-next-line no-param-reassign
      image.isDeleted = true;
      // eslint-disable-next-line no-param-reassign
      image.deleted = true;
      foundImage = true;
    }
    return image;
  });

  if (!foundImage) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Image Not Found or Image Already Deleted');
  }
  const updateUser = await userService.updateUser(
    filter,
    {
      userProfilePic: updatedProfilePic,
    },
    { new: true }
  );

  return res.status(httpStatus.OK).send({ results: updateUser });
});

export const remove = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const filter = {
    _id: userId,
  };
  const user = await userService.removeUser(filter);
  return res.status(httpStatus.OK).send({ results: user });
});
export const getUnique = catchAsync(async (req, res) => {
  const { userUniqueId } = req.params;
  const filter = {
    userUniqueId,
  };
  const options = {};
  const user = await userService.getUserList(filter, options);
  return res.status(httpStatus.OK).send({ results: user });
});

export const getUserByGender = catchAsync(async (req, res) => {
  const { user } = req;
  const filter = { gender: user.gender };
  const options = {};
  const userdata = await userService.getGenderList(filter, options);
  return res.status(httpStatus.OK).send({ results: userdata });
});

async function checkSubscriptionStatus(userId) {
  try {
    // Find the latest subscription for the user
    const latestSubscription = await Subscription.findOne({ user: userId })
      .sort({ createdAt: -1 }) // Sort by createdAt descending to get the latest first
      .exec();

    if (!latestSubscription) {
      return { success: false, message: 'No subscription found for the user' };
    }

    const isActive = latestSubscription.status === 'active';
    return { success: true, isActive };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

console.log('===== checkSubscriptionStatus ====>', checkSubscriptionStatus);

export const checkPlan = catchAsync(async (req, res) => {
  // const viewer = req.body.viewerId;
  const userId = req.user._id;

  const user = await checkSubscriptionStatus(userId);
  return res.status(httpStatus.OK).send({ results: user });
});
