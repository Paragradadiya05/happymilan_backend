import httpStatus from 'http-status';
import { storyService, tokenService } from 'services';
import { catchAsync } from 'utils/catchAsync';
import { sendEmailForStoryConsentTaken } from '../../services/email.service';
import { User } from '../../models';
import { pick } from '../../utils/pick';

export const create = catchAsync(async (req, res) => {
  const { body } = req;
  const userId = req.user._id;
  body.createdBy = req.user;
  body.updatedBy = req.user;
  const options = {};

  const { partnerUserId } = body;

  const partnerUser = await User.findOne({ _id: partnerUserId });
  if (!partnerUser) {
    throw new Error('Partner user not found');
  }

  const story = await storyService.createStory(
    {
      userId,
      ...body,
    },
    options
  );
  const consentToken = await tokenService.generateVerifyStoryConsentToken(userId, story._id);
  await sendEmailForStoryConsentTaken(partnerUser, consentToken);
  console.log('Email sent for consent taken');
  return res.status(httpStatus.CREATED).send({ results: story });
});

export const update = catchAsync(async (req, res) => {
  const { body } = req;
  body.updatedBy = req.user;
  const { storyId } = req.params;
  const filter = {
    _id: storyId,
  };
  const options = { new: true };
  const story = await storyService.updateStory(filter, body, options);
  return res.status(httpStatus.OK).send({ results: story });
});

export const remove = catchAsync(async (req, res) => {
  const { storyId } = req.params;
  const filter = {
    _id: storyId,
  };
  const story = await storyService.removeStory(filter);
  return res.status(httpStatus.OK).send({ results: story });
});

export const list = catchAsync(async (req, res) => {
  const { query } = req;
  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = {
    [sortingObj.sort]: sortingObj.order,
  };
  const filter = {
    isConsentTaken: true,
  };
  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
    lean: true,
  };
  const story = await storyService.getStoryWithPagination(filter, options);
  return res.status(httpStatus.OK).send({ results: story });
});

export const verifyStoryConsent = catchAsync(async (req, res) => {
  try {
    await storyService.verifyConsent(req.query);
    res.status(httpStatus.OK).send({ message: 'Your Story Consent is Verified Successfully' });
  } catch (e) {
    res.status(httpStatus.OK).send({ message: e.message });
  }
});
