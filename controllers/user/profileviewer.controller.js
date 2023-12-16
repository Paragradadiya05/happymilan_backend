import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { profileviewerservice } from '../../services';

export const createProfileViwer = catchAsync(async (req, res) => {
  const profileviwer = await profileviewerservice.createprofileviewer(req.body);
  return res.status(httpStatus.OK).send({ results: profileviwer });
});

export const getprofileviewer = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const viewer = req.body.viewerId;
  const filter = {
    _id: userId,
    viewer,
  };
  const options = {};
  const user = await profileviewerservice.getprofileviewer(filter, options);
  return res.status(httpStatus.OK).send({ results: user });
});
