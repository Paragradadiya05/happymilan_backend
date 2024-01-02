import httpStatus from 'http-status';
import { storyService } from 'services';
import { catchAsync } from 'utils/catchAsync';

export const create = catchAsync(async (req, res) => {
  const { body } = req;
  body.createdBy = req.user;
  body.updatedBy = req.user;
  const options = {};
  const story = await storyService.createStory(body, options);
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
  const filter = {};
  const options = {};
  const story = await storyService.getStoryList(filter, options);
  return res.status(httpStatus.OK).send({ results: story });
});
