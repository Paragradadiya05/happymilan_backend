import { Story, User } from 'models';
import { sendEmailForConsentTaken } from './email.service';

export async function createStory(body = {}) {
  const partnerUser = await User.findOne({ _id: body.partnerUserId });
  if (!partnerUser) {
    throw new Error('Partner user not found');
  }
  // You need to define this function
  await sendEmailForConsentTaken(partnerUser);
  console.log('Email sent for consent taken');
  if (partnerUser.isConsentTaken) {
    const story = await Story.create(body);
    return story;
  }
  throw new Error('Consent is not taken by partner user');
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
