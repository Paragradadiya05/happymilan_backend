import { Story } from 'models';

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
