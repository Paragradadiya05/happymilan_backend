import httpStatus from 'http-status';
import { emailService, friendService, userService, imageBlurService, creditService, vendorService } from 'services';
import { catchAsync } from 'utils/catchAsync';
import { pick } from '../../utils/pick';
import { EnumStatusOfFriend } from '../../models/enum.model';
import ApiError from '../../utils/ApiError';
import { Subscription, User } from '../../models';

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
    const userId = req.user._id;

    if (!userId) {
      return res.status(httpStatus.BAD_REQUEST).send({
        success: false,
        message: 'User ID is missing from the request',
      });
    }

    // Call service
    const result = await userService.checkMissingFields(userId);

    const { missingFields, completionPercentage, totalFields, completedFields, missingCount } = result;

    // Redirect map
    const redirects = {
      createProfile: '/longterm/register/profileselect',
      generalDetails: '/longterm/register/general',
      contactDetails: '/longterm/register/contact',
      hobbies: '/longterm/register/hobby',
      address: '/longterm/register/address',
      education: '/longterm/register/education',
      professional: '/longterm/register/professional',
      profilePic: '/longterm/register/profile-pic',
    };

    // Format output
    const formattedMissingFields = Object.entries(missingFields || {})
      // eslint-disable-next-line no-unused-vars
      .filter(([_, fields]) => Array.isArray(fields) && fields.length > 0)
      .map(([category, fields]) => ({
        category,
        redirect: redirects[category],
        fields,
      }));

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

    return res.status(httpStatus.OK).send({
      success: true,
      data: output,
      profileCompletion: completionPercentage,
      stats: {
        totalFields,
        completedFields,
        missingFields: missingCount,
      },
      message: formattedMissingFields.length > 0 ? 'Some fields are missing' : 'All required fields are filled',
    });
  } catch (error) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      success: false,
      message: 'An error occurred while checking for missing fields',
      error: error.message,
    });
  }
});

export const checkMissingFieldsMobile = catchAsync(async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(httpStatus.BAD_REQUEST).send({
        success: false,
        message: 'User ID is missing from the request',
      });
    }

    // ✅ Correct call
    const result = await userService.checkMissingFieldsMobile(userId);

    const { missingFields, completionPercentage, totalFields, completedFields, missingCount } = result;

    const formattedMissingFields = Object.entries(missingFields || {})
      // eslint-disable-next-line no-unused-vars
      .filter(([_, fields]) => Array.isArray(fields) && fields.length > 0)
      .map(([category, fields]) => ({
        category,
        fields,
      }));

    const output =
      formattedMissingFields.length > 0
        ? formattedMissingFields
        : [
            {
              category: '',
              fields: [],
            },
          ];

    return res.status(httpStatus.OK).send({
      success: true,
      data: output,
      profileCompletion: completionPercentage,
      stats: {
        totalFields,
        completedFields,
        missingFields: missingCount,
      },
      message: formattedMissingFields.length > 0 ? 'Some fields are missing' : 'All required fields are filled',
    });
  } catch (error) {
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

  const result = await vendorService.getvendorUserList(filter, options, userId);

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

  const result = await vendorService.getvendorUserListSearch(filter, options, userId);

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

export const getVendorAreas = catchAsync(async (req, res) => {
  const { businessType, service, search, city } = req.query;

  const options = {
    businessType,
    service,
    search,
    city,
  };

  const userId = req.user ? req.user._id : null;

  const filter = {
    appUsesType: 'vendor',
  };

  const result = await vendorService.getVendorAreasList(filter, options, userId);

  return res.status(httpStatus.OK).send({
    status: 'Success',
    data: result,
  });
});

export const getVendor = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const loggedInUserId = req.user ? req.user._id : null;

  const result = await vendorService.getVendorWithShortlist(userId, loggedInUserId);

  return res.status(httpStatus.OK).send({
    status: 'Success',
    data: result.user,
  });
});

export const getNearbyVendors = catchAsync(async (req, res) => {
  const userId = req.user._id;

  const vendors = await vendorService.getSameCityVendorList(userId);

  return res.status(httpStatus.OK).send({
    success: true,
    results: vendors,
  });
});

export const getNearByUser = catchAsync(async (req, res) => {
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
  const userData = await userService.getNearbyUser(filter, options);

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

export const getmatchUser = catchAsync(async (req, res) => {
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
  const userData = await userService.getGenderListV2WithMatchFilter(filter, options);

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

export const shareProfile = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId).lean();

  if (!user) {
    if (req.query.format === 'json' || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User profile not found');
    }
    return res.status(httpStatus.NOT_FOUND).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Profile Not Found - HappyMilan</title></head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding-top: 50px;">
        <h2>Profile Not Found</h2>
        <p>The requested profile does not exist or has been removed.</p>
        <a href="https://happymilan.com">Go to HappyMilan</a>
      </body>
      </html>
    `);
  }

  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'HappyMilan User';
  const profilePic = user.profilePic || 'https://happymilan.com/logo.png';
  const about = user.aboutMe || user.about || `Check out ${fullName}'s profile on Hapmeet Matrimony app.`;

  const protocol = req.protocol || 'https';
  const host = req.get('host');
  const shareWebUrl = `${protocol}://${host}/v1/user/user/share-profile/${userId}`;
  const appDeepLink = `happymilan://profile/${userId}`;
  const playStoreUrl = `https://play.google.com/store/apps/details?id=com.happymilan2&referrer=userIds%3D${userId}`;
  const marketUrl = `market://details?id=com.happymilan2&referrer=userIds%3D${userId}`;
  const androidIntentUrl = `intent://profile/${userId}#Intent;scheme=happymilan;package=com.happymilan2;S.market_referrer=userIds%3D${userId};end;`;
  const appStoreUrl = `https://apps.apple.com/app/idYOUR_IOS_APP_ID`;

  // Return JSON response if format=json query parameter or Accept: application/json header is sent
  if (req.query.format === 'json' || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.status(httpStatus.OK).send({
      code: httpStatus.OK,
      message: 'Profile share link generated successfully',
      data: {
        userId: user._id,
        name: fullName,
        profilePic,
        about,
        shareUrl: shareWebUrl,
        deepLink: appDeepLink,
        androidIntentUrl,
        playStoreUrl,
        marketUrl,
        appStoreUrl,
        whatsappShareText: `Check out ${fullName}'s profile on Hapmeet: ${shareWebUrl}`,
      },
    });
  }

  // Return HTML with Open Graph Meta Tags for WhatsApp Card Preview & Auto Redirect
  return res.status(httpStatus.OK).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">

      <!-- Open Graph Meta Tags for WhatsApp Card Preview -->
      <meta property="og:site_name" content="Hapmeet Matrimony" />
      <meta property="og:title" content="${fullName} - Hapmeet" />
      <meta property="og:description" content="${about}" />
      <meta property="og:image" content="${profilePic}" />
      <meta property="og:image:width" content="600" />
      <meta property="og:image:height" content="600" />
      <meta property="og:type" content="profile" />
      <meta property="og:url" content="${shareWebUrl}" />

      <!-- Twitter Meta Tags -->
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="${fullName} - Hapmeet">
      <meta name="twitter:description" content="${about}">
      <meta name="twitter:image" content="${profilePic}">

      <title>${fullName} - Hapmeet</title>
      <style>
        body {
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          text-align: center;
          padding: 40px 20px;
          background: linear-gradient(135deg, #f3e8ff 0%, #f8fafc 100%);
          color: #1e293b;
          margin: 0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card {
          max-width: 420px;
          width: 100%;
          background: #ffffff;
          padding: 40px 30px;
          border-radius: 24px;
          box-shadow: 0 10px 30px rgba(108, 92, 231, 0.12);
          box-sizing: border-box;
        }
        .avatar {
          width: 130px;
          height: 130px;
          border-radius: 65px;
          object-fit: cover;
          margin-bottom: 20px;
          border: 4px solid #8225AF;
          box-shadow: 0 6px 20px rgba(130, 37, 175, 0.25);
        }
        h2 {
          font-size: 24px;
          margin: 0 0 10px 0;
          color: #0f172a;
          font-weight: 700;
        }
        .bio {
          font-size: 14px;
          color: #64748b;
          line-height: 1.6;
          margin: 0 0 20px 0;
        }
        .status {
          font-size: 13px;
          color: #8225AF;
          font-weight: 600;
          margin-bottom: 24px;
        }
        .btn {
          display: block;
          background: linear-gradient(123.55deg, #0F52BA 0%, #8225AF 81.56%);
          color: #ffffff !important;
          padding: 16px 28px;
          text-decoration: none;
          border-radius: 50px;
          font-weight: 700;
          font-size: 16px;
          box-shadow: 0 6px 20px rgba(130, 37, 175, 0.35);
          transition: all 0.2s ease-in-out;
        }
        .btn:hover {
          opacity: 0.95;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(130, 37, 175, 0.45);
        }
      </style>
      <script>
        window.onload = function() {
          var userAgent = navigator.userAgent || navigator.vendor || window.opera;
          var isAndroid = /android/i.test(userAgent);
          var isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;

          if (isAndroid) {
            // 1. Launch Android Intent URL (Opens App directly if installed, or native Play Store app if not installed)
            window.location.href = "${androidIntentUrl}";

            // 2. Fallback to native Play Store app scheme after 2.5s if Intent didn't trigger
            setTimeout(function() {
              window.location.href = "${marketUrl}";
            }, 2500);
          } else if (isIOS) {
            window.location.href = "${appDeepLink}";
            setTimeout(function() {
              window.location.href = "${appStoreUrl}";
            }, 2000);
          }
        };

        function openAppOrStore() {
          var userAgent = navigator.userAgent || navigator.vendor || window.opera;
          var isAndroid = /android/i.test(userAgent);

          if (isAndroid) {
            window.location.href = "${androidIntentUrl}";
          } else {
            window.location.href = "${appDeepLink}";
          }
        }
      </script>
    </head>
    <body>
      <div class="card">
        <img src="${profilePic}" alt="${fullName}" class="avatar" />
        <h2>${fullName}</h2>
        <p class="bio">${about}</p>
        <p class="status">Opening Hapmeet App...</p>
        <a href="${marketUrl}" onclick="openAppOrStore(); return false;" class="btn">Download Hapmeet App</a>
      </div>
    </body>
    </html>
  `);
});
