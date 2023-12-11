import httpStatus from 'http-status';
import { friendService } from 'services';
import { catchAsync } from 'utils/catchAsync';
import { EnumStatusOfFriend } from '../../models/enum.model';

export const getFriend = catchAsync(async (req, res) => {
  const { friendId } = req.params;
  const filter = {
    _id: friendId,
  };
  const options = {};
  const friend = await friendService.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: friend });
});

export const listFriend = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const friend = await friendService.getFriendList(filter, options);
  return res.status(httpStatus.OK).send({ results: friend });
});

export const paginateFriend = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const friend = await friendService.getFriendListWithPagination(filter, options);
  return res.status(httpStatus.OK).send({ results: friend });
});

export const createFriend = catchAsync(async (req, res) => {
  const options = {};
  const friend = await friendService.createFriend(req.body, options);
  return res.status(httpStatus.OK).send({ results: friend });
});

export const updateFriend = catchAsync(async (req, res) => {
  const { body } = req;
  const { friendId } = req.params;
  const filter = {
    _id: friendId,
  };
  const options = { new: true };
  const friend = await friendService.updateFriend(filter, body, options);
  return res.status(httpStatus.OK).send({ results: friend });
});

export const removeFriend = catchAsync(async (req, res) => {
  const { friendId } = req.params;
  const filter = {
    _id: friendId,
  };
  const friend = await friendService.removeFriend(filter);
  return res.status(httpStatus.OK).send({ results: friend });
});

export const respondFriendRequest = catchAsync(async (req, res) => {
  const { request, status, user } = req.body;
  req.body.user = request;
  await friendService.respondFriendRequest(request, status, user);
  return res.status(httpStatus.OK).send({ success: true });
});
export const getblocklist = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const filter = {
    friend: userId,
    status: EnumStatusOfFriend.BLOCKED,
  };
  const options = {};
  const user = await friendService.getFriendList(filter, options);

  return res.status(httpStatus.OK).send({ results: user });
});

export const getReuests = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const filter = {
    friend: userId,
    status: EnumStatusOfFriend.REQUESTED,
  };
  const options = {};
  const user = await friendService.getFriendList(filter, options);
  return res.status(httpStatus.OK).send({ results: user });
});

export const getReuestsfriend = catchAsync(async (req, res) => {
  const { friendId } = req.params;
  const filter = {
    usrer: friendId,
    status: EnumStatusOfFriend.REQUESTED,
  };
  const options = {};
  const user = await friendService.getFriendList(filter, options);
  return res.status(httpStatus.OK).send({ results: user });
});
