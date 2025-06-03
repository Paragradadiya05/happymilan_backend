import { Notification, Story, Token, User } from 'models';
import { tokenService } from './index';
import { EnumTypeOfToken } from '../models/enum.model';
import { sendNotification } from './notification.service';

export async function createStory(body = {}, currentUser = null) {
  const story = await Story.create(body);
  if (body.partnerUserId && currentUser) {
    const partnerUser = await User.findById(body.partnerUserId);
    if (partnerUser) {
      const notification = await Notification.create({
        userId: partnerUser._id,
        otherUserId: currentUser._id,
        userName: currentUser.name,
        body: `${currentUser.name} created a story and requested your consent.`,
        title: 'STORY_CONSENT_REQUEST',
      });
      console.log('=====xx====>', currentUser);
      if (partnerUser.deviceTokens && partnerUser.deviceTokens.length) {
        await Promise.all(
          partnerUser.deviceTokens.map(async (fcmToken) => {
            await sendNotification(
              fcmToken.deviceToken,
              {
                data: {
                  _id: notification._id.toString(),
                  userId: partnerUser._id.toString(),
                  otherUserId: currentUser._id.toString(),
                  body: `${currentUser.name} create story`,
                  title: 'story',
                  createdAt: notification.createdAt.toString(),
                  updatedAt: notification.updatedAt.toString(),
                },
              },
              {}
            );
          })
        );
      }
    }
  }
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
