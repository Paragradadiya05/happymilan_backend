import httpStatus from 'http-status';
import { emailService, friendService, userService, imageBlurService, creditService } from 'services';
import { catchAsync } from 'utils/catchAsync';
import { pick } from '../../utils/pick';
import { EnumStatusOfFriend } from '../../models/enum.model';
import ApiError from '../../utils/ApiError';
import { Subscription } from '../../models';

export const get = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const userData = await userService.getMatchUser({ user: req.user._id, userId });

  if (userData && userData.length > 0) {
    const userItem = userData[0];
    const privacy = userItem.privacySettingCustom || {};
    const friendsStatus = userItem.friendsDetails.status;

    const isFriendAccepted = friendsStatus === 'accepted';

    const shouldBlurImage =
      (privacy.profilePhotoPrivacy === true && !isFriendAccepted) ||
      (privacy.showPhotoToFriendsOnly === true && !isFriendAccepted);

    if (shouldBlurImage) {
      const imageProcessingPromises = [];

      // Blur main profilePic
      if (userItem.profilePic) {
        imageProcessingPromises.push(
          imageBlurService.blurImage(userItem.profilePic).then((blurredUrl) => {
            userItem.profilePic = blurredUrl;
          })
        );
      }

      // Blur each photo in userProfilePic array
      if (Array.isArray(userItem.userProfilePic) && userItem.userProfilePic.length > 0) {
        const photoBlurPromises = userItem.userProfilePic.map((photo, index) =>
          imageBlurService.blurImage(photo.url).then((blurredUrl) => {
            userItem.userProfilePic[index] = {
              ...photo,
              url: blurredUrl,
            };
          })
        );

        imageProcessingPromises.push(...photoBlurPromises);
      }

      await Promise.all(imageProcessingPromises);
    }
  }

  return res.status(httpStatus.OK).send({ results: userData });
});

export const getDatingUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user;
  const filter = {
    _id: userId,
    currentUserId,
  };
  const options = {};
  const userData = await userService.getUserWithDatingData(filter, options);
  if (userData && userData.length > 0) {
    const userItem = userData[0];
    const privacy = userItem.privacySettingCustom || {};
    const friendsArray = userItem.friendsDetails || [];

    const isFriendAccepted = friendsArray.some((friend) => friend.status === 'accepted');

    const shouldBlurImage =
      (privacy.profilePhotoPrivacy === true && !isFriendAccepted) ||
      (privacy.showPhotoToFriendsOnly === true && !isFriendAccepted);

    if (shouldBlurImage) {
      const imageProcessingPromises = [];

      // Blur main profilePic
      if (userItem.profilePic) {
        imageProcessingPromises.push(
          imageBlurService.blurImage(userItem.profilePic).then((blurredUrl) => {
            userItem.profilePic = blurredUrl;
          })
        );
      }

      // Blur each photo in userProfilePic array
      if (Array.isArray(userItem.userProfilePic) && userItem.userProfilePic.length > 0) {
        const photoBlurPromises = userItem.userProfilePic.map((photo, index) =>
          imageBlurService.blurImage(photo.url).then((blurredUrl) => {
            userItem.userProfilePic[index] = {
              ...photo,
              url: blurredUrl,
            };
          })
        );

        imageProcessingPromises.push(...photoBlurPromises);
      }

      await Promise.all(imageProcessingPromises);
    }
  }
  return res.status(httpStatus.OK).send({ results: userData });
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
  const userId = req.user._id;
  const getFriend = await friendService.getFriendList(filter, options, userId);
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

  // if (user.profilePic === profileImageUrl) {
  //   throw new ApiError(httpStatus.BAD_REQUEST, 'change profile pic first then you can able to delete this image');
  // }

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
  const userData = await userService.getMatchUser({ userId: getUser._id, user: user._id });
  if (userData && userData.length > 0) {
    const userItem = userData[0];
    const privacy = userItem.privacySettingCustom || {};
    const friendsStatus = userItem.friendsDetails.status;

    const isFriendAccepted = friendsStatus === 'accepted';

    const shouldBlurImage =
      (privacy.profilePhotoPrivacy === true && !isFriendAccepted) ||
      (privacy.showPhotoToFriendsOnly === true && !isFriendAccepted);

    if (shouldBlurImage) {
      const imageProcessingPromises = [];

      // Blur main profilePic
      if (userItem.profilePic) {
        imageProcessingPromises.push(
          imageBlurService.blurImage(userItem.profilePic).then((blurredUrl) => {
            userItem.profilePic = blurredUrl;
          })
        );
      }

      // Blur each photo in userProfilePic array
      if (Array.isArray(userItem.userProfilePic) && userItem.userProfilePic.length > 0) {
        const photoBlurPromises = userItem.userProfilePic.map((photo, index) =>
          imageBlurService.blurImage(photo.url).then((blurredUrl) => {
            userItem.userProfilePic[index] = {
              ...photo,
              url: blurredUrl,
            };
          })
        );

        imageProcessingPromises.push(...photoBlurPromises);
      }

      await Promise.all(imageProcessingPromises);
    }
  }
  // Step 3: Return the matched users
  return res.status(httpStatus.OK).json({
    success: true,
    data: userData,
  });
});

export const getUserByGender = catchAsync(async (req, res) => {
  const { user } = req;
  const { query } = req;

  // Extract sort and order, and set defaults
  const sortField = query.sort || 'createdAt';
  const sortOrder = query.order === 'desc' ? -1 : 1;

  // Stable sort object using _id as a tiebreaker
  const sortObj = {
    [sortField]: sortOrder,
    _id: sortOrder, // Ensures uniqueness in sort order
  };

  const filter = {
    gender: user.gender,
    userId: user._id,
  };

  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
  };
  const userData = await userService.getGenderListV2(filter, options);

  if (userData[0] && userData[0].paginatedResults) {
    const processPromises = userData[0].paginatedResults.map(async (userItem) => {
      const privacy = userItem.privacySettingCustom || {};
      const friendsStatus = userItem.friendsDetails.status;

      const shouldBlurImage =
        privacy.profilePhotoPrivacy === true || (privacy.showPhotoToFriendsOnly === true && friendsStatus !== 'accepted');

      if (shouldBlurImage) {
        const imageProcessingPromises = [];

        // Blur main profilePic
        if (userItem.profilePic) {
          imageProcessingPromises.push(
            imageBlurService.blurImage(userItem.profilePic).then((blurredUrl) => {
              // eslint-disable-next-line no-param-reassign
              userItem.profilePic = blurredUrl;
            })
          );
        }

        // Blur all userProfilePic photos
        if (Array.isArray(userItem.userProfilePic) && userItem.userProfilePic.length > 0) {
          const photoBlurPromises = userItem.userProfilePic.map((photo, index) =>
            imageBlurService.blurImage(photo.url).then((blurredUrl) => {
              // eslint-disable-next-line no-param-reassign
              userItem.userProfilePic[index] = {
                ...photo,
                url: blurredUrl,
              };
            })
          );
          imageProcessingPromises.push(...photoBlurPromises);
        }

        await Promise.all(imageProcessingPromises);
      }

      return userItem;
    });

    userData[0].paginatedResults = await Promise.all(processPromises);
  }

  return res.status(httpStatus.OK).send({ results: userData });
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
  const { user, query } = req;
  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = {
    [sortingObj.sort]: sortingObj.order,
  };

  const filter = { gender: user.gender, userId: user._id };
  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
  };

  const userData = await userService.getDatingPartnerList(filter, options);

  if (userData[0] && userData[0].paginatedResults) {
    const processPromises = userData[0].paginatedResults.map(async (userItem) => {
      const privacy = userItem.privacySettingCustom || {};
      const friendsStatus = userItem.friendsDetails.status;

      const shouldBlurImage =
        privacy.profilePhotoPrivacy === true || (privacy.showPhotoToFriendsOnly === true && friendsStatus !== 'accepted');

      if (shouldBlurImage) {
        const imageProcessingPromises = [];

        // Blur main profilePic
        if (userItem.profilePic) {
          imageProcessingPromises.push(
            imageBlurService.blurImage(userItem.profilePic).then((blurredUrl) => {
              // eslint-disable-next-line no-param-reassign
              userItem.profilePic = blurredUrl;
            })
          );
        }

        // Blur all userProfilePic photos
        if (Array.isArray(userItem.userProfilePic) && userItem.userProfilePic.length > 0) {
          const photoBlurPromises = userItem.userProfilePic.map((photo, index) =>
            imageBlurService.blurImage(photo.url).then((blurredUrl) => {
              // eslint-disable-next-line no-param-reassign
              userItem.userProfilePic[index] = {
                ...photo,
                url: blurredUrl,
              };
            })
          );
          imageProcessingPromises.push(...photoBlurPromises);
        }

        await Promise.all(imageProcessingPromises);
      }

      return userItem;
    });

    userData[0].paginatedResults = await Promise.all(processPromises);
  }

  return res.status(httpStatus.OK).send({ results: userData });
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

  const userData = await userService.getDatingPartnerListByAgeAndMatch(filter, ageRange, options);

  if (userData[0] && userData[0].paginatedResults) {
    const processPromises = userData[0].paginatedResults.map(async (userItem) => {
      const privacy = userItem.privacySettingCustom || {};

      // ✅ Always safe: handle missing friendsDetails gracefully
      const friendsStatus =
        userItem && userItem.friendsDetails && userItem.friendsDetails.status ? userItem.friendsDetails.status : null;

      const shouldBlurImage =
        privacy.profilePhotoPrivacy === true || (privacy.showPhotoToFriendsOnly === true && friendsStatus !== 'accepted');

      if (shouldBlurImage) {
        const imageProcessingPromises = [];

        // Blur main profilePic
        if (userItem.profilePic) {
          imageProcessingPromises.push(
            imageBlurService.blurImage(userItem.profilePic).then((blurredUrl) => {
              // eslint-disable-next-line no-param-reassign
              userItem.profilePic = blurredUrl;
            })
          );
        }

        // Blur all userProfilePic photos
        if (Array.isArray(userItem.userProfilePic) && userItem.userProfilePic.length > 0) {
          const photoBlurPromises = userItem.userProfilePic.map((photo, index) =>
            imageBlurService.blurImage(photo.url).then((blurredUrl) => {
              // eslint-disable-next-line no-param-reassign
              userItem.userProfilePic[index] = {
                ...photo,
                url: blurredUrl,
              };
            })
          );
          imageProcessingPromises.push(...photoBlurPromises);
        }

        await Promise.all(imageProcessingPromises);
      }

      return userItem;
    });

    userData[0].paginatedResults = await Promise.all(processPromises);
  }

  return res.status(httpStatus.OK).send({ results: userData });
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

  const userData = await userService.getFilteredDatingInterestList(filter, options);
  if (userData[0] && userData[0].paginatedResults) {
    const processPromises = userData[0].paginatedResults.map(async (userItem) => {
      const privacy = userItem.privacySettingCustom || {};
      const friendsStatus = userItem.friendsDetails.status;

      const shouldBlurImage =
        privacy.profilePhotoPrivacy === true || (privacy.showPhotoToFriendsOnly === true && friendsStatus !== 'accepted');

      if (shouldBlurImage) {
        const imageProcessingPromises = [];

        // Blur main profilePic
        if (userItem.profilePic) {
          imageProcessingPromises.push(
            imageBlurService.blurImage(userItem.profilePic).then((blurredUrl) => {
              // eslint-disable-next-line no-param-reassign
              userItem.profilePic = blurredUrl;
            })
          );
        }

        // Blur all userProfilePic photos
        if (Array.isArray(userItem.userProfilePic) && userItem.userProfilePic.length > 0) {
          const photoBlurPromises = userItem.userProfilePic.map((photo, index) =>
            imageBlurService.blurImage(photo.url).then((blurredUrl) => {
              // eslint-disable-next-line no-param-reassign
              userItem.userProfilePic[index] = {
                ...photo,
                url: blurredUrl,
              };
            })
          );
          imageProcessingPromises.push(...photoBlurPromises);
        }

        await Promise.all(imageProcessingPromises);
      }

      return userItem;
    });

    userData[0].paginatedResults = await Promise.all(processPromises);
  }
  return res.status(httpStatus.OK).send({ results: userData });
});

export const searchUser = catchAsync(async (req, res) => {
  const { user } = req;
  const { query } = req;
  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = {
    [sortingObj.sort]: sortingObj.order,
  };

  const filter = {
    userId: user._id,
    Ethnicity: req.body.Ethnicity, // InterestedIn filter passed as a single string value
  };

  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
  };

  const userData = await userService.getFilteredDatingEthnicityList(filter, options);

  if (userData[0] && userData[0].paginatedResults) {
    const processPromises = userData[0].paginatedResults.map(async (userItem) => {
      const privacy = userItem.privacySettingCustom || {};

      // ✅ Safe check for friendsDetails
      const friendsStatus =
        userItem && userItem.friendsDetails && userItem.friendsDetails.status ? userItem.friendsDetails.status : null;

      const shouldBlurImage =
        privacy.profilePhotoPrivacy === true || (privacy.showPhotoToFriendsOnly === true && friendsStatus !== 'accepted');

      if (shouldBlurImage) {
        const imageProcessingPromises = [];

        // Blur main profilePic
        if (userItem.profilePic) {
          imageProcessingPromises.push(
            imageBlurService.blurImage(userItem.profilePic).then((blurredUrl) => {
              // eslint-disable-next-line no-param-reassign
              userItem.profilePic = blurredUrl;
            })
          );
        }

        // Blur all userProfilePic photos
        if (Array.isArray(userItem.userProfilePic) && userItem.userProfilePic.length > 0) {
          const photoBlurPromises = userItem.userProfilePic.map((photo, index) =>
            imageBlurService.blurImage(photo.url).then((blurredUrl) => {
              // eslint-disable-next-line no-param-reassign
              userItem.userProfilePic[index] = {
                ...photo,
                url: blurredUrl,
              };
            })
          );
          imageProcessingPromises.push(...photoBlurPromises);
        }

        await Promise.all(imageProcessingPromises);
      }

      return userItem;
    });

    userData[0].paginatedResults = await Promise.all(processPromises);
  }

  return res.status(httpStatus.OK).send({ results: userData });
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
  const userdata = await userService.getPrimeUserList(filter, options);
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
  const userData = await userService.getNewUserList(filter, options);

  if (userData[0] && userData[0].paginatedResults) {
    const processPromises = userData[0].paginatedResults.map(async (userItem) => {
      const privacy = userItem.privacySettingCustom || {};
      const friendsStatus = userItem.friendsDetails.status;

      const shouldBlurImage =
        privacy.profilePhotoPrivacy === true || (privacy.showPhotoToFriendsOnly === true && friendsStatus !== 'accepted');

      if (shouldBlurImage) {
        const imageProcessingPromises = [];

        // Blur main profilePic
        if (userItem.profilePic) {
          imageProcessingPromises.push(
            imageBlurService.blurImage(userItem.profilePic).then((blurredUrl) => {
              // eslint-disable-next-line no-param-reassign
              userItem.profilePic = blurredUrl;
            })
          );
        }

        // Blur all userProfilePic photos
        if (Array.isArray(userItem.userProfilePic) && userItem.userProfilePic.length > 0) {
          const photoBlurPromises = userItem.userProfilePic.map((photo, index) =>
            imageBlurService.blurImage(photo.url).then((blurredUrl) => {
              // eslint-disable-next-line no-param-reassign
              userItem.userProfilePic[index] = {
                ...photo,
                url: blurredUrl,
              };
            })
          );
          imageProcessingPromises.push(...photoBlurPromises);
        }

        await Promise.all(imageProcessingPromises);
      }

      return userItem;
    });

    userData[0].paginatedResults = await Promise.all(processPromises);
  }

  return res.status(httpStatus.OK).send({ results: userData });
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

export const checkMissingFieldsMobile = catchAsync(async (req, res) => {
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
    const missingFields = await userService.checkMissingFieldsMobile(filter, options);
    // Map the missing fields to the desired format
    const formattedMissingFields = Object.entries(missingFields || {}) // Ensure missingFields is an object
      // eslint-disable-next-line no-unused-vars
      .filter(([_, fields]) => Array.isArray(fields) && fields.length > 0) // Ignore empty categories
      .map(([category, fields]) => ({
        category,
        fields,
      }));

    // Ensure the output matches the desired structure
    const output =
      formattedMissingFields.length > 0
        ? formattedMissingFields
        : [
            {
              category: '',
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

export const updateUser = catchAsync(async (req, res) => {
  const filter = { _id: req.user._id };
  const { body } = req;

  await userService.updateUserForAuth(filter, body, { returnNewDocument: true, new: true, upsert: true }, req.user);

  res.status(httpStatus.OK).send({ message: 'User updated successfully' });
});

export const getCreditByUserId = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const credit = await creditService.getUserCreditBalance(userId);

  if (credit === null || credit === undefined) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: 'Credit record not found for this user',
    });
  }

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Credit fetched successfully',
    credit,
  });
});

export const deleteUserAccount = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { deleteReason } = req.body;

  await userService.deleteUserPermanently(userId, deleteReason);

  res.status(httpStatus.OK).send({
    status: true,
    message: 'Your account has been deleted permanently',
  });
});

export const getVendorUserList = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const filter = {
    appUsesType: 'vendor',
  };

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const userId = req.user ? req.user._id : null;

  const result = await userService.getvendorUserList(filter, options, userId);

  return res.status(httpStatus.OK).send({
    status: 'Success',
    data: result.results,
    pagination: result.pagination,
  });
});

export const getVendorByBusinessType = catchAsync(async (req, res) => {
  const { businessType, service, search, page, limit, city, area } = req.query;

  const options = {
    page,
    limit,
    search,
    businessType,
    service,
    city,
    area,
  };
  const userId = req.user ? req.user._id : null;
  const filter = {
    appUsesType: 'vendor',
  };

  const result = await userService.getvendorUserListSearch(filter, options, userId);

  return res.status(httpStatus.OK).send({
    status: 'Success',
    data: result.results,
    pagination: result.pagination,
  });
});

export const getUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const filter = {
    _id: userId,
  };
  const options = {};
  const user = await userService.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: user });
});
