import { Notification, Story, Token, User } from 'models';
import httpStatus from 'http-status';
import { tokenService } from './index';
import { EnumTypeOfToken } from '../models/enum.model';
import ApiError from '../utils/ApiError';
import { sendNotification } from './notification.service';

export async function createStory(body = {}, user) {
  const getUser = await User.findOne({ _id: body.partnerUserId });
  if (!getUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No such user exists');
  }
  const partnerUser = await User.findById(body.partnerUserId);
  if (!partnerUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No such user exists');
  }
  const createNotificationForStory = await Notification.create({
    userId: body.partnerUserId,
    otherUserId: user._id,
    userName: user.name,
    body: `${user.name} Requested to approve a story`,
    title: 'new story',
  });
  if (partnerUser.deviceTokens.length) {
    await partnerUser.deviceTokens.map(async (fcmToken) => {
      await sendNotification(fcmToken.deviceToken, {
        data: {
          _id: createNotificationForStory._id.toString(),
          userId: createNotificationForStory.userId.toString(),
          otherUserId: createNotificationForStory.otherUserId.toString(),
          body: `${user.name} Requested to approve a story`,
          title: 'new story',
          createdAt: createNotificationForStory.createdAt.toString(),
          updatedAt: createNotificationForStory.updatedAt.toString(),
        },
      });
    });
  }
  const story = await Story.create(body);
  return story;
}

export async function updateStory(filter, body, options = {}) {
  const story = await Story.findOneAndUpdate(filter, body, options);
  return story;
}

export async function removeStory(filter) {
  const story = await Story.findOneAndRemove(filter);
  return story;
}

export async function getStoryList(filter, options = {}) {
  const story = await Story.find(filter, options.projection, options);
  return story;
}

export async function getStoryById(id, options = {}) {
  const story = await Story.findById(id, options.projection, options);
  return story;
}

export async function verifyConsent(verifyRequest) {
  const { consentToken } = verifyRequest;
  const verifyEmailTokenDoc = await tokenService.verifyToken(consentToken, EnumTypeOfToken.STORY_CONSENT);
  const { user, storyId } = verifyEmailTokenDoc;
  await Token.deleteMany({ user, storyId, type: EnumTypeOfToken.STORY_CONSENT });

  return Story.findByIdAndUpdate(storyId, { isConsentTaken: true });
}

export async function getStoryWithPagination(filter, options = {}) {
  const story = await Story.paginate(filter, {
    ...options,
    populate: {
      path: 'userId',
      select: 'name lastName',
    },
  });
  return story;
}

export async function getOne(query, options = {}) {
  const story = await Story.findOne(query, options.projection, options).populate({
    path: 'userId',
    select: 'name lastName',
  });

  return story;
}
