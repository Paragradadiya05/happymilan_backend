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

  const escalate = await profileviewerservice.getProfileViewertWithPagination(filter, options);

  const items = escalate && Array.isArray(escalate) && escalate.length > 0 ? escalate[0].paginatedResults || [] : [];

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

  return res.status(httpStatus.OK).send({ escalate });
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
