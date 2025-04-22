import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { imageBlurService, shortlistervice } from '../../services';
import { pick } from '../../utils/pick';

export const createShortlist = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const body = {
    shortlistId: req.body.shortlistId,
    userId,
  };

  body.createdBy = req.user;
  body.updatedBy = req.user;
  const shortlist = await shortlistervice.createshortList(body);
  return res.status(httpStatus.OK).send({ results: shortlist });
});
export const getShortlistByUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const filter = {
    userId,
  };
  const options = {};
  const escalate = await shortlistervice.getShortlist(filter, options);
  return res.status(httpStatus.OK).send({ results: escalate });
});
export const getshortlist = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const user = await shortlistervice.getShortlist(filter, options);
  return res.status(httpStatus.OK).send({ results: user });
});

export const deleteShortlistByUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const filter = {
    _id: id,
  };
  const escalate = await shortlistervice.removeshotylist(filter);
  return res.status(httpStatus.OK).send({ results: escalate });
});

export const getShortlistPagination = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { query } = req;
  const { appUsesType } = req.query;

  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = {
    [sortingObj.sort]: sortingObj.order,
  };

  const filter = {
    userId,
    user: req.user._id,
    appUsesType,
  };

  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
    populate: {
      path: 'shortlistId',
      populate: [{ path: 'address' }, { path: 'userEducation' }, { path: 'userPartner' }, { path: 'userProfessional' }],
    },
  };

  const escalate = await shortlistervice.getshortListWithPagination(filter, options);

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

  return res.status(httpStatus.OK).send({ results: escalate });
});

export const getShortlistMobile = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { query } = req;
  const { appUsesType } = req.query;

  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = {
    [sortingObj.sort || 'createdAt']: sortingObj.order || 'desc',
  };

  const filter = {
    userId,
    appUsesType,
  };

  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
    populate: {
      path: 'shortlistId',
      populate: [{ path: 'address' }, { path: 'userEducation' }, { path: 'userPartner' }, { path: 'userProfessional' }],
    },
  };

  const escalate = await shortlistervice.getshortListforMobile(filter, options);
  const items = escalate && Array.isArray(escalate) && escalate.length > 0 ? escalate[0].paginatedResults || [] : [];

  // Loop through and apply blur logic where needed
  // eslint-disable-next-line no-restricted-syntax
  for (const item of items) {
    const userItem = item.friendList;

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

  return res.status(httpStatus.OK).send({ results: escalate });
});
