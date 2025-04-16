import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { imageBlurService, profileviewerservice } from '../../services';
import { pick } from '../../utils/pick';

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
  const sortObj = {
    [sortingObj.sort]: sortingObj.order,
  };

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

  // ✅ Fix here: Access the correct nested viewer array
  const results = (user && user[0] && user[0].paginatedResults) || [];

  const blurPromises = results.map(async (item) => {
    const viewer = item.user;
    const friendsStatus = item.friendsDetails && item.friendsDetails.status ? item.friendsDetails.status : 'none';
    const isFriendAccepted = friendsStatus === 'accepted';

    if (viewer) {
      const privacy = viewer.privacySettingCustom || {};
      const profilePhotoPrivacy = privacy.profilePhotoPrivacy === true;
      const showPhotoToFriendsOnly = privacy.showPhotoToFriendsOnly === true;

      const shouldBlurImage = (profilePhotoPrivacy || showPhotoToFriendsOnly) && !isFriendAccepted;

      if (shouldBlurImage) {
        const processing = [];

        if (viewer.profilePic) {
          processing.push(
            imageBlurService.blurImage(viewer.profilePic).then((blurredUrl) => {
              viewer.profilePic = blurredUrl;
            })
          );
        }

        if (Array.isArray(viewer.userProfilePic) && viewer.userProfilePic.length > 0) {
          const blurPhotos = viewer.userProfilePic.map((photo, index) =>
            imageBlurService.blurImage(photo.url).then((blurredUrl) => {
              viewer.userProfilePic[index] = {
                ...photo,
                url: blurredUrl,
              };
            })
          );
          processing.push(...blurPhotos);
        }

        await Promise.all(processing);
      }
    }
  });

  await Promise.all(blurPromises);

  return res.status(httpStatus.OK).send({ results });
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

export const getProfilevisitors = catchAsync(async (req, res) => {
  const { userId } = req.params;
  // const viewer = req.body.viewerId;
  const filter = {
    viewerId: userId,
  };
  const options = {};
  const user = await profileviewerservice.getProfileVisitor(filter, options);
  return res.status(httpStatus.OK).send({ results: user });
});
