import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { StorylikeService } from '../../services';

export const createLike = catchAsync(async (req, res) => {
  const like = await StorylikeService.createLike(req.body, req.user);
  return res.status(httpStatus.OK).send({ results: like });
});

export const getLike = catchAsync(async (req, res) => {
  // const viewer = req.body.viewerId;
  const userId = req.user._id;

  const filter = {
    user: userId,
  };
  const options = {};
  const like = await StorylikeService.getLike(filter, options);
  return res.status(httpStatus.OK).send({ results: like });
});
export const remove = catchAsync(async (req, res) => {
  const { likeId } = req.params;
  const filter = {
    _id: likeId,
  };
  const like = await StorylikeService.removeLike(filter);
  return res.status(httpStatus.OK).send({ results: like });
});
export const updateLike = catchAsync(async (req, res) => {
  const { body } = req;
  const { likeId } = req.params;
  const filter = {
    _id: likeId,
  };
  const options = { new: true };
  const like = await StorylikeService.updateLike(filter, body, options);
  return res.status(httpStatus.OK).send({ results: like });
});
export const likeData = catchAsync(async (req, res) => {
  const { storyId } = req.params;
  const filter = {
    storyId,
  };
  const options = {};
  const like = await StorylikeService.getLike(filter, options);
  return res.status(httpStatus.OK).send({ results: like });
});
export const StorylikeData = catchAsync(async (req, res) => {
  const { storyId } = req.params;
  const user = req.user._id;

  const filter = {
    storyId,
    user,
    isLike: true,
  };
  const options = {};
  const like = await StorylikeService.getLike(filter, options);
  return res.status(httpStatus.OK).send({ results: like });
});
export const paginateStatus = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { page, limit } = req.query;
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const filter = {
    storyId: userId,
    isLike: true,
  };
  const options = {
    page: pageNumber,
    limit: limitNumber,
  };
  const like = await StorylikeService.getLikeListWithPagination(filter, options);
  return res.status(httpStatus.OK).send({ results: like });
});

export const userPaginateStatus = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { page, limit } = req.query;
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const filter = {
    user: userId,
  };
  const options = {
    page: pageNumber,
    limit: limitNumber,
  };
  const like = await StorylikeService.getLikeListWithPagination(filter, options);
  return res.status(httpStatus.OK).send({ results: like });
});

export const PaginateStory = catchAsync(async (req, res) => {
  const { storyId } = req.params;
  const { page, limit } = req.query;
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const filter = {
    storyId,
    isLike: true,
  };
  const options = {
    page: pageNumber,
    limit: limitNumber,
  };
  const like = await StorylikeService.getLikeListWithPagination(filter, options);
  return res.status(httpStatus.OK).send({ results: like });
});
