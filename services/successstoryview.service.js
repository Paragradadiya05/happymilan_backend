import { Story, SuccessStoryview, User } from '../models';

export async function createStoryView(body = {}) {
  const storyExists = await Story.findOne({ _id: body.storyId });
  if (!storyExists) {
    throw new Error('Story not found ');
  }
  const ViewerExists = await User.findOne({ _id: body.viewerId });
  if (!ViewerExists) {
    throw new Error('Viewer not found ');
  }
  const existingStoryView = await SuccessStoryview.findOne({ StoryId: body.storyId, viewerId: body.viewerId });
  if (existingStoryView) {
    return existingStoryView;
  }
  const Storyview = await SuccessStoryview.create(body);
  return Storyview;
}

export async function getList(filter, options = {}) {
  const Storyview = await SuccessStoryview.find(filter, options.projection, options)
    .populate('storyId')
    .populate('viewerId');
  return Storyview;
}

export async function getListWithPagination(filter, options = {}) {
  // eslint-disable-next-line no-param-reassign
  options.populate = [{ path: 'storyId' }, { path: 'viewerId' }];
  const Storyview = await SuccessStoryview.paginate(filter, options);
  return Storyview;
}
