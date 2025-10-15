import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { catchAsync } from '../../utils/catchAsync';
import { imageBlurService, profileviewerservice } from '../../services';
import { pick } from '../../utils/pick';
import { checkUserPremiumStatus } from '../../services/friend.service';
import { EnumStatusOfFriend } from '../../models/enum.model';
import { ProfileView } from '../../models';

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

  // 🔹 Aggregation to include user + friend data
  const pipeline = [
    { $match: { viewerId: mongoose.Types.ObjectId(userId) } },

    // ✅ Join visitor (user who viewed profile)
    {
      $lookup: {
        from: 'User',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },

    // ✅ Join friend details
    {
      $lookup: {
        from: 'Friend',
        let: { viewerUserId: '$user._id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  {
                    $and: [{ $eq: ['$user', mongoose.Types.ObjectId(userId)] }, { $eq: ['$friend', '$$viewerUserId'] }],
                  },
                  {
                    $and: [{ $eq: ['$user', '$$viewerUserId'] }, { $eq: ['$friend', mongoose.Types.ObjectId(userId)] }],
                  },
                ],
              },
            },
          },
          { $project: { status: 1, _id: 0 } }, // only return status
        ],
        as: 'friendsDetails',
      },
    },
    {
      $unwind: {
        path: '$friendsDetails',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        $or: [{ 'friendsDetails.status': { $ne: EnumStatusOfFriend.BLOCKED } }, { friendsDetails: { $exists: false } }],
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  ];

  const userVisitors = await ProfileView.aggregate(pipeline);
  const totalCount = await ProfileView.countDocuments({ viewerId: userId });

  // ✅ Check if logged-in user is premium
  let isPremiumUser = false;
  try {
    isPremiumUser = await checkUserPremiumStatus(userId);
  } catch (err) {
    console.log('⚠️ Error checking premium status:', err.message);
  }

  if (!userVisitors.length) {
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

  // ✅ Loop each visitor
  // eslint-disable-next-line no-restricted-syntax
  for (const visitor of userVisitors) {
    const viewer = visitor.user;
    // eslint-disable-next-line no-continue
    if (!viewer) continue;
    const friendsStatus =
      visitor && visitor.friendsDetails && visitor.friendsDetails.status ? visitor.friendsDetails.status : 'none';
    const baseData = {
      _id: visitor._id,
      viewerId: viewer._id,
      createdAt: visitor.createdAt,
      lastViewTime: visitor.lastViewTime,
      friendsDetails: { status: friendsStatus }, // ✅ include in response
    };

    // --- PRIVACY LOGIC START ---
    const privacy = viewer.privacySettingCustom || {};
    const isFriendAccepted = friendsStatus === 'accepted';

    const shouldBlurImage =
      (privacy.profilePhotoPrivacy === true && !isFriendAccepted) ||
      (privacy.showPhotoToFriendsOnly === true && !isFriendAccepted);
    // --- PRIVACY LOGIC END ---

    const filteredPrivacy = {
      showPhotoToFriendsOnly:
        privacy && typeof privacy.showPhotoToFriendsOnly === 'boolean' ? privacy.showPhotoToFriendsOnly : false,
      profilePhotoPrivacy: privacy && typeof privacy.profilePhotoPrivacy === 'boolean' ? privacy.profilePhotoPrivacy : false,
    };

    if (isPremiumUser && !shouldBlurImage) {
      results.push({
        ...baseData,
        profilePic: viewer.profilePic,
        userProfilePic: viewer.userProfilePic,
        firstName: viewer.firstName,
        lastName: viewer.lastName,
        name: viewer.name,
        dateOfBirth: viewer.dateOfBirth,
        privacySetting: viewer.privacySetting,
        Occupation:
          Array.isArray(viewer.datingData) && viewer.datingData.length > 0 ? viewer.datingData[0].Occupation : null,
        privacySettingCustom: filteredPrivacy,
      });
    } else {
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
            viewer.userProfilePic[index] = { ...photo, url: blurredUrl };
          })
        );
        imageProcessingPromises.push(...photoBlurPromises);
      }

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
        privacySetting: viewer.privacySetting,
        Occupation:
          Array.isArray(viewer.datingData) && viewer.datingData.length > 0 ? viewer.datingData[0].Occupation : null,
        privacySettingCustom: filteredPrivacy,
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
