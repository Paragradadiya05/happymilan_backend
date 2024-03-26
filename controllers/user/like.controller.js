import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { likeservice } from '../../services';

export const createLike = catchAsync(async (req, res) => {
  const like = await likeservice.createLike(req.body, req.user);
  return res.status(httpStatus.OK).send({ results: like });
});

export const getLike = catchAsync(async (req, res) => {
  const { userId } = req.params;
  // const viewer = req.body.viewerId;
  const filter = {
    user: userId,
  };
  const options = {};
  const like = await likeservice.getLike(filter, options);
  return res.status(httpStatus.OK).send({ results: like });
});
export const remove = catchAsync(async (req, res) => {
  const { likeId } = req.params;
  const filter = {
    _id: likeId,
  };
  const like = await likeservice.removeLike(filter);
  return res.status(httpStatus.OK).send({ results: like });
});
export const updateLike = catchAsync(async (req, res) => {
  const { body } = req;
  const { likeId } = req.params;
  const filter = {
    _id: likeId,
  };
  const options = { new: true };
  const like = await likeservice.updateLike(filter, body, options);
  return res.status(httpStatus.OK).send({ results: like });
});
