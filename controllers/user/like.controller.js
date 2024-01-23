import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { likeservice } from '../../services';

export const createlike = catchAsync(async (req, res) => {
  const like = await likeservice.createlike(req.body, req.user);
  return res.status(httpStatus.OK).send({ results: like });
});

export const getlike = catchAsync(async (req, res) => {
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
