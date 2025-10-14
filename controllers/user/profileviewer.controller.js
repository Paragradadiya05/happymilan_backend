import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { imageBlurService, profileviewerservice } from '../../services';
import { pick } from '../../utils/pick';
import { checkUserPremiumStatus } from '../../services/friend.service';

export const createProfileViwer = catchAsync(async (req, res) => {
  const { appUsesType } = req.query;
  const profileViewer = await profileviewerservice.createprofileviewer(req.body, req.user, appUsesType);
  return res.status(httpStatus.OK).send({ results: profileViewer });
});

export const getProfileViewer = catchAsync(async (req, res) => {
  const { userId } = req.params;
  // const viewer = req.body.viewerId;
  const filter = {
    user: userId,
  };
  const options = {};
  const user = await profileviewerservice.getProfileViewer(filter, options);
  return res.status(httpStatus.OK).send({ results: user });
});

export const getProfileViewerV2 = catchAsync(async (req, res) => {
  const { query } = req;
  const { appUsesType } = req.query;
  const { userId } = req.params;

  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = sortingObj.sort ? { [sortingObj.sort]: sortingObj.order === 'asc' ? 1 : -1 } : { createdAt: -1 };

  const filter = { userId, appUsesType };
  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
    lean: true,
    populate: {
      path: 'viewerId',
      populate: [{ path: 'address' }, { path: 'userEducation' }, { path: 'userPartner' }, { path: 'userProfessional' }],
    },
  };

  const user = await profileviewerservice.getProfileViewertWithPagination(filter, options);

  const items = user && Array.isArray(user) && user.length > 0 ? user[0].paginatedResults || [] : [];

  // Loop through and apply blur logic where needed
  // eslint-disable-next-line no-restricted-syntax
  for (const item of items) {
    const userItem = item.user;

    if (userItem) {
      const privacy = userItem.privacySettingCustom || {};
      const friendsStatus = item.friendsDetails && item.friendsDetails.status ? item.friendsDetails.status : 'none';
      const isFriendAccepted = friendsStatus === 'accepted';

      const shouldBlurImage =
        (privacy.profilePhotoPrivacy === true && !isFriendAccepted) ||
        (privacy.showPhotoToFriendsOnly === true && !isFriendAccepted);

      if (shouldBlurImage) {
        const imageProcessingPromises = [];

        // Blur profilePic
        if (userItem.profilePic) {
          imageProcessingPromises.push(
            imageBlurService.blurImage(userItem.profilePic).then((blurredUrl) => {
              userItem.profilePic = blurredUrl;
            })
          );
        }

        // Blur all userProfilePics
        if (Array.isArray(userItem.userProfilePic)) {
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

        // eslint-disable-next-line no-await-in-loop
        await Promise.all(imageProcessingPromises);
      }
    }
  }

  return res.status(httpStatus.OK).send({ results: user });
});

export const GetProfileviwerMobile = catchAsync(async (req, res) => {
  const { query } = req;
  const { appUsesType } = req.query;
  const { userId } = req.params;
  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = {
    [sortingObj.sort]: sortingObj.order,
  };

  // const viewer = req.body.viewerId;
  const filter = {
    userId,
    appUsesType,
  };
  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
    lean: true,
    populate: {
      path: 'viewerId',
      populate: [{ path: 'address' }, { path: 'userEducation' }, { path: 'userPartner' }, { path: 'userProfessional' }],
    },
  };
  const user = await profileviewerservice.getProfileViewerforMobile(filter, options);
  return res.status(httpStatus.OK).send({ results: user });
});

// controller/profileViewer.controller.js
export const getProfilevisitors = catchAsync(async (req, res) => {
  const userId = req.user._id;

  if (!userId) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      status: 'Fail',
      message: 'User not authenticated',
    });
  }

  // Pagination setup
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = { viewerId: userId };

  const options = {
    lean: true,
    populate: {
      path: 'user',
      select:
        'firstName lastName name profilePic userProfilePic userProfessional address dateOfBirth datingData privacySettingCustom friendsDetails',
      populate: [{ path: 'address' }, { path: 'userProfessional' }],
    },
    sort: { createdAt: -1 },
    skip,
    limit,
  };

  const { data: userVisitors, totalCount } = await profileviewerservice.getProfileVisitorPaginated(filter, options);

  // Check if user is premium
  let isPremiumUser = false;
  try {
    isPremiumUser = await checkUserPremiumStatus(userId);
  } catch (err) {
    console.log('⚠️ Error checking premium status:', err.message);
  }

  if (!userVisitors || userVisitors.length === 0) {
    return res.status(httpStatus.OK).json({
      status: 'Success',
      message: 'No visitors found',
      isPremiumUser,
      count: 0,
      totalPages: 0,
      currentPage: page,
      data: [],
    });
  }

  const results = [];

  // Loop through each visitor
  // eslint-disable-next-line no-restricted-syntax
  for (const visitor of userVisitors) {
    const viewer = visitor.user;
    // eslint-disable-next-line no-continue
    if (!viewer) continue;

    const baseData = {
      _id: visitor._id,
      viewerId: viewer._id,
      createdAt: visitor.createdAt,
      lastViewTime: visitor.lastViewTime,
    };

    // --- PRIVACY LOGIC START ---
    const privacy = viewer.privacySettingCustom || {};
    const friendsStatus = viewer.friendsDetails && viewer.friendsDetails.status ? viewer.friendsDetails.status : 'none';
    const isFriendAccepted = friendsStatus === 'accepted';

    const shouldBlurImage =
      (privacy.profilePhotoPrivacy === true && !isFriendAccepted) ||
      (privacy.showPhotoToFriendsOnly === true && !isFriendAccepted);
    // --- PRIVACY LOGIC END ---

    // ✅ If user is Premium, show all images clear
    if (isPremiumUser && !shouldBlurImage) {
      results.push({
        ...baseData,
        profilePic: viewer.profilePic,
        userProfilePic: viewer.userProfilePic,
        firstName: viewer.firstName,
        lastName: viewer.lastName,
        name: viewer.name,
        dateOfBirth: viewer.dateOfBirth,
        Occupation:
          Array.isArray(viewer.datingData) && viewer.datingData.length > 0 ? viewer.datingData[0].Occupation : null,
      });
    } else {
      // 🚨 Non-premium user OR privacy restrictions → apply blur
      const imageProcessingPromises = [];

      if (viewer.profilePic) {
        imageProcessingPromises.push(
          imageBlurService.blurImage(viewer.profilePic).then((blurredUrl) => {
            viewer.profilePic = blurredUrl;
          })
        );
      }

      if (Array.isArray(viewer.userProfilePic)) {
        const photoBlurPromises = viewer.userProfilePic.map((photo, index) =>
          imageBlurService.blurImage(photo.url).then((blurredUrl) => {
            viewer.userProfilePic[index] = {
              ...photo,
              url: blurredUrl,
            };
          })
        );
        imageProcessingPromises.push(...photoBlurPromises);
      }

      // Wait until all blur tasks finish
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(imageProcessingPromises);

      results.push({
        ...baseData,
        profilePic: viewer.profilePic,
        userProfilePic: viewer.userProfilePic,
        firstName: viewer.firstName,
        lastName: viewer.lastName,
        name: viewer.name,
        dateOfBirth: viewer.dateOfBirth,
        Occupation:
          Array.isArray(viewer.datingData) && viewer.datingData.length > 0 ? viewer.datingData[0].Occupation : null,
      });
    }
  }

  return res.status(httpStatus.OK).json({
    status: 'Success',
    userId,
    isPremiumUser,
    count: results.length,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    data: results,
  });
});
