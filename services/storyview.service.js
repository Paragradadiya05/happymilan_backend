import { Status, StoryView, User } from '../models';

export async function createStoryView(body = {}) {
  const storyExists = await Status.findOne({ _id: body.statusId });
  if (!storyExists) {
    throw new Error('Story not found ');
  }
  const ViewerExists = await User.findOne({ _id: body.viewerId });
  if (!ViewerExists) {
    throw new Error('Viewer not found ');
  }
  const Storyview = await StoryView.create(body);
  return Storyview;
}

export async function getList(filter, options = {}) {
  const Storyview = await StoryView.find(filter, options.projection, options).populate('storyId').populate('viewerId');
  return Storyview;
}

export async function getListWithPagination(filter, options = {}) {
  const Storyview = await StoryView.paginate(filter, options);
  return Storyview;
}
