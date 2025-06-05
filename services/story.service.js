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

export async function verifyConsent(verifyRequest, loginUser) {
  const { consentToken } = verifyRequest;
  const verifyEmailTokenDoc = await tokenService.verifyToken(consentToken, EnumTypeOfToken.STORY_CONSENT);
  const { user, storyId } = verifyEmailTokenDoc;
  await Token.deleteMany({ user, storyId, type: EnumTypeOfToken.STORY_CONSENT });

  const updatedStory = Story.findByIdAndUpdate(storyId, { isConsentTaken: true });
  const loginUserDoc = await User.findById(loginUser._id);
  if (!loginUserDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Logged-in user not found');
  }

  const createNotificationForConsent = await Notification.create({
    userId: loginUser._id,
    otherUserId: user,
    userName: loginUserDoc.name,
    body: `Your story consent is verified.`,
    title: 'Consent Approved',
  });

  // ✅ Send push notification to loginUser
  if (loginUserDoc.deviceTokens.length) {
    await Promise.all(
      loginUserDoc.deviceTokens.map(async (fcmToken) => {
        try {
          await sendNotification(fcmToken.deviceToken, {
            data: {
              _id: createNotificationForConsent._id.toString(),
              userId: createNotificationForConsent.userId.toString(),
              otherUserId: createNotificationForConsent.otherUserId.toString(),
              body: `Your story consent is verified.`,
              title: 'Consent Approved',
              createdAt: createNotificationForConsent.createdAt.toString(),
              updatedAt: createNotificationForConsent.updatedAt.toString(),
            },
          });
        } catch (err) {
          console.error('FCM error:', err.message);
        }
      })
    );
  }

  return updatedStory;
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
