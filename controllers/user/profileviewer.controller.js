import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { profileviewerservice } from '../../services';
import { pick } from '../../utils/pick';

export const createProfileViwer = catchAsync(async (req, res) => {
  const profileViewer = await profileviewerservice.createprofileviewer(req.body, req.user);
  return res.status(httpStatus.OK).send({ results: profileViewer });
});

export const getProfileViewer = catchAsync(async (req, res) => {
  const { userId } = req.params;
  // const viewer = req.body.viewerId;
  const filter = {
    user: userId,
  };
  const options = {};
  const user = await profileviewerservice.getProfileViewer(filter, options);
  return res.status(httpStatus.OK).send({ results: user });
});

export const getProfileViewerV2 = catchAsync(async (req, res) => {
  const { query } = req;
  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = {
    [sortingObj.sort]: sortingObj.order,
  };
  const { userId } = req.params;
  // const viewer = req.body.viewerId;
  const filter = {
    user: userId,
  };
  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
    lean: true,
  };
  const user = await profileviewerservice.getProfileViewertWithPagination(filter, options);
  return res.status(httpStatus.OK).send({ results: user });
});
