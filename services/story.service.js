import { Story, Token } from 'models';
import { tokenService } from './index';
import { EnumTypeOfToken } from '../models/enum.model';

export async function createStory(body = {}) {
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
  const story = await Story.paginate(filter, options);
  return story;
}
