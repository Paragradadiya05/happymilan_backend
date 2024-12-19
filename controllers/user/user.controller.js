import httpStatus from 'http-status';
import { emailService, friendService, userService } from 'services';
import { catchAsync } from 'utils/catchAsync';
import { pick } from '../../utils/pick';
import { EnumStatusOfFriend } from '../../models/enum.model';
import ApiError from '../../utils/ApiError';
import { Subscription } from '../../models';

export const get = catchAsync(async (req, res) => {
  const { userId } = req.params;
  // user => current user id
  // userID => other user id that we need to get
  const user = await userService.getMatchUser({ user: req.user._id, userId });
  return res.status(httpStatus.OK).send({ results: user });
});

export const getDatingUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user;
  const filter = {
    _id: userId,
    currentUserId,
  };
  const options = {};
  const user = await userService.getUserWithDatingData(filter, options);
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
  const filteredProfilePics = updateUser.userProfilePic.filter((image) => !image.isDeleted);
  return res.status(httpStatus.OK).send({ results: { ...updateUser.toObject(), userProfilePic: filteredProfilePics } });
});

export const remove = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const filter = {
    _id: userId,
  };
  const user = await userService.removeUser(filter);
  await emailService.DeleteUserEmail(user);

  return res.status(httpStatus.OK).send({ results: user });
});

export const getUnique = catchAsync(async (req, res) => {
  const { user } = req;
  const { userUniqueId } = req.params;

  // Step 1: Fetch user ID from userUniqueId
  const filter = { userUniqueId };
  const options = {};

  const getUser = await userService.getOne(filter, options);

  if (!getUser || getUser.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // user => current user id
  // userID => other user id that we need to get
  // Step 2: Use the userId to call the getMatchUser service
  const matchedUsers = await userService.getMatchUser({ userId: getUser._id, user: user._id });

  // Step 3: Return the matched users
  return res.status(httpStatus.OK).json({
    success: true,
    data: matchedUsers,
  });
});

export const getUserByGender = catchAsync(async (req, res) => {
  const { user } = req;
  const { query } = req;
  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = {
    [sortingObj.sort]: sortingObj.order,
  };
  const filter = { gender: user.gender, userId: user._id };
  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
  };
  const userdata = await userService.getGenderListV2(filter, options);
  return res.status(httpStatus.OK).send({ results: userdata });
});

export const getMatchUser = catchAsync(async (req, res) => {
  const { user } = req;
  const { userId } = req.params;

  // user => current user id
  // userID => other user id that we need to get
  const result = await userService.getMatchUser({ userId, user: user._id });
  return res.status(httpStatus.OK).send({ results: result });
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

export const checkPlan = catchAsync(async (req, res) => {
  // const viewer = req.body.viewerId;
  const userId = req.user._id;

  const user = await checkSubscriptionStatus(userId);
  return res.status(httpStatus.OK).send({ results: user });
});

export const getUserByGenderDating = catchAsync(async (req, res) => {
  const { user } = req;
  const { query } = req;
  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = {
    [sortingObj.sort]: sortingObj.order,
  };
  const filter = { gender: user.gender, userId: user._id };
  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
  };

  const userdata = await userService.getDatingPartnerList(filter, options);
  return res.status(httpStatus.OK).send({ results: userdata });
});

export const getUserByGenderAndAgeAndMatchDating = catchAsync(async (req, res) => {
  const { user } = req;
  const { query, body } = req;
  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = {
    [sortingObj.sort]: sortingObj.order,
  };
  const filter = { gender: user.gender, userId: user._id };
  const ageRange = {
    minAge: body.minAge,
    maxAge: body.maxAge,
  };
  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
  };

  const userdata = await userService.getDatingPartnerListByAgeAndMatch(filter, ageRange, options);
  return res.status(httpStatus.OK).send({ results: userdata });
});

export const getFilteredDatingUsers = catchAsync(async (req, res) => {
  const { user } = req;
  const { query } = req;
  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = {
    [sortingObj.sort]: sortingObj.order,
  };

  const filter = {
    userId: user._id,
    interestedIn: req.body.interestedIn, // InterestedIn filter passed as a single string value
  };

  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
  };

  const userdata = await userService.getFilteredDatingintrestList(filter, options);
  return res.status(httpStatus.OK).send({ results: userdata });
});

export const getprimeuser = catchAsync(async (req, res) => {
  const { user } = req;
  const { query } = req;
  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = {
    [sortingObj.sort]: sortingObj.order,
  };
  const filter = { gender: user.gender, userId: user._id };
  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
  };
  const userdata = await userService.getprimeuserlist(filter, options);
  return res.status(httpStatus.OK).send({ results: userdata });
});

export const getStats = catchAsync(async (req, res) => {
  const userId = req.user._id; // Assuming user ID is coming from authenticated user

  // Fetch the user stats
  const { totalLikes, totalRequestsSent, totalAcceptedRequests, totalRequestsReceived } = await userService.getUserStats(
    userId
  );

  // Send the response with all the data
  return res.status(httpStatus.OK).send({
    totalLikes,
    totalRequestsSent,
    totalAcceptedRequests,
    totalRequestsReceived,
  });
});

export const getnewuser = catchAsync(async (req, res) => {
  const { user } = req;
  const { query } = req;
  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = {
    [sortingObj.sort]: sortingObj.order,
  };
  const filter = { gender: user.gender, userId: user._id };
  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
  };
  const userdata = await userService.getNewUserList(filter, options);
  return res.status(httpStatus.OK).send({ results: userdata });
});

export const checkMissingFields = catchAsync(async (req, res) => {
  try {
    const userId = req.user._id; // Ensure req.user is populated by middleware
    if (!userId) {
      return res.status(httpStatus.BAD_REQUEST).send({
        success: false,
        message: 'User ID is missing from the request',
      });
    }

    const filter = { _id: userId }; // Filter to find the specific user
    const options = {}; // Exclude sensitive fields like password

    // Call the service function to check for missing fields
    const missingFields = await userService.checkMissingFields(filter, options);

    // Define redirect URLs for each category
    const redirects = {
      createProfile: '/longterm/register/profileselect',
      generalDetails: '/longterm/register/general',
      contactDetails: '/longterm/register/contact',
      hobbies: '/longterm/register/hobby',
      address: '/longterm/register/address',
      education: '/longterm/register/education',
      professional: '/longterm/register/professional',
    };

    // Map the missing fields to the desired format
    const formattedMissingFields = Object.entries(missingFields || {}) // Ensure missingFields is an object
      // eslint-disable-next-line no-unused-vars
      .filter(([_, fields]) => Array.isArray(fields) && fields.length > 0) // Ignore empty categories
      .map(([category, fields]) => ({
        category,
        redirect: redirects[category],
        fields,
      }));

    // Ensure the output matches the desired structure
    const output =
      formattedMissingFields.length > 0
        ? formattedMissingFields
        : [
            {
              category: '',
              redirect: '',
              fields: [],
            },
          ];

    // Return response with appropriate message and formatted data
    return res.status(httpStatus.OK).send({
      success: true,
      data: output,
      message: formattedMissingFields.length > 0 ? 'Some fields are missing' : 'All required fields are filled',
    });
  } catch (error) {
    // Handle unexpected errors
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      success: false,
      message: 'An error occurred while checking for missing fields',
      error: error.message,
    });
  }
});
