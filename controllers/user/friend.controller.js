import httpStatus from 'http-status';
import { friendService, imageBlurService } from 'services';
import { catchAsync } from 'utils/catchAsync';
import { EnumStatusOfFriend } from '../../models/enum.model';
import { pick } from '../../utils/pick';
import { Shortlist } from '../../models';

export const getFriend = catchAsync(async (req, res) => {
  const { friendId } = req.params;
  const filter = {
    _id: friendId,
  };
  const options = {};
  const friend = await friendService.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: friend });
});

export const listFriend = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const userId = req.user._id;
  const friend = await friendService.getFriendList(filter, options, userId);
  return res.status(httpStatus.OK).send({ results: friend });
});

export const paginateFriend = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const friend = await friendService.getFriendListWithPagination(filter, options);
  return res.status(httpStatus.OK).send({ results: friend });
});

export const createFriend = catchAsync(async (req, res) => {
  const { user } = req;
  const { appUsesType } = req.query;
  const friend = await friendService.createFriend(req.body, user, appUsesType);
  return res.status(httpStatus.OK).send({ results: friend });
});

export const updateFriend = catchAsync(async (req, res) => {
  const { body } = req;
  const { friendId } = req.params;
  const filter = {
    _id: friendId,
  };
  const options = { new: true };
  const friend = await friendService.updateFriend(filter, body, options);
  return res.status(httpStatus.OK).send({ results: friend });
});

export const removeFriend = catchAsync(async (req, res) => {
  const { friendId } = req.params;
  const filter = {
    _id: friendId,
  };
  const friend = await friendService.removeFriend(filter);
  return res.status(httpStatus.OK).send({ results: friend });
});

export const respondFriendRequest = catchAsync(async (req, res) => {
  const { request, status, user } = req.body;
  const { appUsesType } = req.query;

  // req.body.user = request;
  await friendService.respondFriendRequest(request, status, user, appUsesType);
  return res.status(httpStatus.OK).send({ success: true });
});
export const getBlockList = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const filter = {
    status: EnumStatusOfFriend.BLOCKED,
    user: userId,
  };
  const { query } = req;
  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = {
    [sortingObj.sort]: sortingObj.order,
  };
  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
    lean: true,
  };

  const getuser = await friendService.getBlock(filter, options, userId);

  getuser.results = await Promise.all(
    getuser.results.map(async (frdData) => {
      const { friend } = frdData;
      const { user } = frdData;

      const { friend: _f, user: _u, ...restFrdData } = frdData;

      if (friend.shortlistData === undefined || friend.shortlistData.length === 0) {
        delete friend.shortlistData;
      }

      // === Blur Logic ===
      const privacy = friend.privacySettingCustom || {};
      const friendsStatus = frdData.status;
      const isFriendAccepted = friendsStatus === 'accepted';

      const shouldBlurImage =
        (privacy.profilePhotoPrivacy === true && !isFriendAccepted) ||
        (privacy.showPhotoToFriendsOnly === true && !isFriendAccepted);

      if (shouldBlurImage) {
        const imageProcessingPromises = [];

        // Blur main profilePic
        if (friend.profilePic) {
          imageProcessingPromises.push(
            imageBlurService.blurImage(friend.profilePic).then((blurredUrl) => {
              friend.profilePic = blurredUrl;
            })
          );
        }

        // Blur userProfilePic array
        if (Array.isArray(friend.userProfilePic) && friend.userProfilePic.length > 0) {
          const photoBlurPromises = friend.userProfilePic.map((photo, index) =>
            imageBlurService.blurImage(photo.url).then((blurredUrl) => {
              friend.userProfilePic[index] = {
                ...photo,
                url: blurredUrl,
              };
            })
          );
          imageProcessingPromises.push(...photoBlurPromises);
        }

        await Promise.all(imageProcessingPromises);
      }

      return {
        ...restFrdData,
        friend,
        user,
      };
    })
  );

  return res.status(httpStatus.OK).send({ results: getuser });
});

export const getRequests = catchAsync(async (req, res) => {
  const userId = req.user._id;

  const filter = {
    friend: userId,
    status: EnumStatusOfFriend.REQUESTED,
  };

  const options = {};
  const users = await friendService.getFriendList(filter, options, userId);

  users.results = await Promise.all(
    users.results.map(async (frdData) => {
      const otherUser = frdData.user; // The one who sent the request (not current user)

      // Remove empty shortlistData
      if (!otherUser.shortlistData || otherUser.shortlistData.length === 0) {
        delete otherUser.shortlistData;
      }

      // === Blur Logic ===
      const privacy = otherUser.privacySettingCustom || {};
      const isFriendAccepted = frdData.status === 'accepted';

      const shouldBlurImage =
        (privacy.profilePhotoPrivacy === true && !isFriendAccepted) ||
        (privacy.showPhotoToFriendsOnly === true && !isFriendAccepted);

      if (shouldBlurImage) {
        const imageProcessingPromises = [];

        // Blur main profilePic
        if (otherUser.profilePic) {
          imageProcessingPromises.push(
            imageBlurService.blurImage(otherUser.profilePic).then((blurredUrl) => {
              otherUser.profilePic = blurredUrl;
            })
          );
        }

        // Blur userProfilePic array
        if (Array.isArray(otherUser.userProfilePic) && otherUser.userProfilePic.length > 0) {
          const photoBlurPromises = otherUser.userProfilePic.map((photo, index) =>
            imageBlurService.blurImage(photo.url).then((blurredUrl) => {
              otherUser.userProfilePic[index] = {
                ...photo,
                url: blurredUrl,
              };
            })
          );
          imageProcessingPromises.push(...photoBlurPromises);
        }

        await Promise.all(imageProcessingPromises);
      }

      const { friend, user, ...restFrdData } = frdData;

      return {
        ...restFrdData,
        user, // other user who sent the request (blurred if needed)
      };
    })
  );

  return res.status(httpStatus.OK).send({ results: users });
});
export const getMyFrdRequests = catchAsync(async (req, res) => {
  const userId = req.user._id;

  // Filter for friend list
  const friendFilter = {
    status: EnumStatusOfFriend.ACCEPTED,
    $or: [{ friend: userId }, { user: userId }],
  };
  const options = {};

  // Fetch friend data
  const friends = await friendService.getFriendv2(friendFilter, options, userId);

  // Fetch shortlist data for the user
  const shortlist = await Shortlist.find({ userId });

  // Combine the results
  return res.status(httpStatus.OK).send({
    friends,
    shortlists: shortlist,
  });
});

export const getMyFrdRequestsMobile = catchAsync(async (req, res) => {
  const { query } = req;
  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = {
    [sortingObj.sort]: sortingObj.order,
  };
  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
    lean: true,
  };
  const userId = req.user._id;

  const filter = {
    status: EnumStatusOfFriend.ACCEPTED,
    $or: [{ friend: userId }, { user: userId }],
  };

  const getuser = await friendService.getFriendAcceptedMobile(filter, options, userId);

  getuser.results = await Promise.all(
    getuser.results.map(async (frdData) => {
      let friendList;
      let userList;

      if (frdData.friend._id.toString() === userId.toString()) {
        friendList = frdData.user;
        userList = frdData.friend;
      } else {
        friendList = frdData.friend;
        userList = frdData.user;
      }

      const { friend, user, ...restFrdData } = frdData;

      if (friendList.shortlistData === undefined || friendList.shortlistData.length === 0) {
        delete friendList.shortlistData;
      }

      // === Blur Logic ===
      const privacy = friendList.privacySettingCustom || {};
      const friendsStatus = frdData.status;
      const isFriendAccepted = friendsStatus === 'accepted';

      const shouldBlurImage =
        (privacy.profilePhotoPrivacy === true && !isFriendAccepted) ||
        (privacy.showPhotoToFriendsOnly === true && !isFriendAccepted);

      if (shouldBlurImage) {
        const imageProcessingPromises = [];

        // Blur main profilePic
        if (friendList.profilePic) {
          imageProcessingPromises.push(
            imageBlurService.blurImage(friendList.profilePic).then((blurredUrl) => {
              friendList.profilePic = blurredUrl;
            })
          );
        }

        // Blur userProfilePic array
        if (Array.isArray(friendList.userProfilePic) && friendList.userProfilePic.length > 0) {
          const photoBlurPromises = friendList.userProfilePic.map((photo, index) =>
            imageBlurService.blurImage(photo.url).then((blurredUrl) => {
              friendList.userProfilePic[index] = {
                ...photo,
                url: blurredUrl,
              };
            })
          );
          imageProcessingPromises.push(...photoBlurPromises);
        }

        await Promise.all(imageProcessingPromises);
      }

      return {
        ...restFrdData,
        friendList,
        userList,
      };
    })
  );

  return res.status(httpStatus.OK).send({ results: getuser });
});

export const getRejectedFrdRequests = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const filter = {
    status: EnumStatusOfFriend.REJECTED,
    friend: userId,
  };
  const options = {};
  const users = await friendService.getFriendList(filter, options, userId);
  users.results = await Promise.all(
    users.results.map(async (frdData) => {
      const otherUser = frdData.user; // The one who sent the request (not current user)

      // Remove empty shortlistData
      if (!otherUser.shortlistData || otherUser.shortlistData.length === 0) {
        delete otherUser.shortlistData;
      }

      // === Blur Logic ===
      const privacy = otherUser.privacySettingCustom || {};
      const isFriendAccepted = frdData.status === 'accepted';

      const shouldBlurImage =
        (privacy.profilePhotoPrivacy === true && !isFriendAccepted) ||
        (privacy.showPhotoToFriendsOnly === true && !isFriendAccepted);

      if (shouldBlurImage) {
        const imageProcessingPromises = [];

        // Blur main profilePic
        if (otherUser.profilePic) {
          imageProcessingPromises.push(
            imageBlurService.blurImage(otherUser.profilePic).then((blurredUrl) => {
              otherUser.profilePic = blurredUrl;
            })
          );
        }

        // Blur userProfilePic array
        if (Array.isArray(otherUser.userProfilePic) && otherUser.userProfilePic.length > 0) {
          const photoBlurPromises = otherUser.userProfilePic.map((photo, index) =>
            imageBlurService.blurImage(photo.url).then((blurredUrl) => {
              otherUser.userProfilePic[index] = {
                ...photo,
                url: blurredUrl,
              };
            })
          );
          imageProcessingPromises.push(...photoBlurPromises);
        }

        await Promise.all(imageProcessingPromises);
      }

      const { friend, user, ...restFrdData } = frdData;

      return {
        ...restFrdData,
        user, // other user who sent the request (blurred if needed)
      };
    })
  );
  return res.status(httpStatus.OK).send({ results: users });
});

export const getRequestedFriend = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  const filter = {
    user: userId,
    status: EnumStatusOfFriend.REQUESTED,
  };

  const options = { page, limit };
  const users = await friendService.getFriendList(filter, options, userId);

  users.results = await Promise.all(
    users.results.map(async (frdData) => {
      let friendList;

      if (frdData.friend._id.toString() === userId.toString()) {
        friendList = frdData.user;
      } else {
        friendList = frdData.friend;
      }

      const { friend, user, ...restFrdData } = frdData;

      if (friendList.shortlistData === undefined || friendList.shortlistData.length === 0) {
        delete friendList.shortlistData;
      }

      // === Blur Logic ===
      const privacy = friendList.privacySettingCustom || {};
      const friendsStatus = frdData.status;
      const isFriendAccepted = friendsStatus === 'accepted';

      const shouldBlurImage =
        (privacy.profilePhotoPrivacy === true && !isFriendAccepted) ||
        (privacy.showPhotoToFriendsOnly === true && !isFriendAccepted);

      if (shouldBlurImage) {
        const imageProcessingPromises = [];

        // Blur main profilePic
        if (friendList.profilePic) {
          imageProcessingPromises.push(
            imageBlurService.blurImage(friendList.profilePic).then((blurredUrl) => {
              friendList.profilePic = blurredUrl;
            })
          );
        }

        // Blur userProfilePic array
        if (Array.isArray(friendList.userProfilePic) && friendList.userProfilePic.length > 0) {
          const photoBlurPromises = friendList.userProfilePic.map((photo, index) =>
            imageBlurService.blurImage(photo.url).then((blurredUrl) => {
              friendList.userProfilePic[index] = {
                ...photo,
                url: blurredUrl,
              };
            })
          );
          imageProcessingPromises.push(...photoBlurPromises);
        }

        await Promise.all(imageProcessingPromises);
      }

      return {
        ...restFrdData,
        friendList,
      };
    })
  );

  return res.status(httpStatus.OK).send({
    results: users,
  });
});

export const getRequestedFriendv2 = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { query } = req;
  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = {
    [sortingObj.sort]: sortingObj.order,
  };
  const { appUsesType } = req.query;
  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
    lean: true,
    populate: [
      {
        path: 'friend',
        populate: [{ path: 'address' }, { path: 'userEducation' }, { path: 'userPartner' }, { path: 'userProfessional' }],
      },
      {
        path: 'user',
        populate: [{ path: 'address' }, { path: 'userEducation' }, { path: 'userPartner' }, { path: 'userProfessional' }],
      },
    ],
  };
  const filter = {
    user: userId,
    status: EnumStatusOfFriend.REQUESTED,
  };
  const user = await friendService.getFriendListWithPagination(filter, options, appUsesType);
  return res.status(httpStatus.OK).send({ results: user });
});

export const getRejectedFrdRequestsv2 = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { query } = req;
  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = {
    [sortingObj.sort]: sortingObj.order,
  };
  const filter = {
    status: EnumStatusOfFriend.REJECTED,
    $or: [{ friend: userId }, { user: userId }],
  };
  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
    lean: true,
    populate: [
      {
        path: 'friend',
        populate: [{ path: 'address' }, { path: 'userEducation' }, { path: 'userPartner' }, { path: 'userProfessional' }],
      },
      {
        path: 'user',
        populate: [{ path: 'address' }, { path: 'userEducation' }, { path: 'userPartner' }, { path: 'userProfessional' }],
      },
    ],
  };
  const user = await friendService.getFriendListWithPagination(filter, options);
  return res.status(httpStatus.OK).send({ results: user });
});

export const getBlockListv2 = catchAsync(async (req, res) => {
  const { query } = req;
  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = {
    [sortingObj.sort]: sortingObj.order,
  };
  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
    lean: true,
    populate: [
      {
        path: 'friend',
        populate: [{ path: 'address' }, { path: 'userEducation' }, { path: 'userPartner' }, { path: 'userProfessional' }],
      },
      {
        path: 'user',
        populate: [{ path: 'address' }, { path: 'userEducation' }, { path: 'userPartner' }, { path: 'userProfessional' }],
      },
    ],
  };
  const userId = req.user._id;
  const filter = {
    user: userId,
    status: EnumStatusOfFriend.BLOCKED,
  };
  const user = await friendService.getFriendListWithPagination(filter, options);

  return res.status(httpStatus.OK).send({ results: user });
});

export const getRFrdRequestsv2 = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { query } = req;
  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = {
    [sortingObj.sort]: sortingObj.order,
  };
  const filter = {
    friend: userId,
    status: EnumStatusOfFriend.REQUESTED,
  };
  const { appUsesType } = query;
  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
    lean: true,
    populate: [
      {
        path: 'friend',
        populate: [{ path: 'address' }, { path: 'userEducation' }, { path: 'userPartner' }, { path: 'userProfessional' }],
      },
      {
        path: 'user',
        populate: [{ path: 'address' }, { path: 'userEducation' }, { path: 'userPartner' }, { path: 'userProfessional' }],
      },
    ],
  };
  const user = await friendService.getFriendListWithPagination(filter, options, appUsesType);
  return res.status(httpStatus.OK).send({ results: user });
});

export const BlockUser = catchAsync(async (req, res) => {
  const { user } = req;
  const { appUsesType } = req.query;
  const friend = await friendService.blockUser(req.body, user, appUsesType);
  return res.status(httpStatus.OK).send({ results: friend });
});
