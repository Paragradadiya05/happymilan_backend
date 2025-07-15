import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { spamUserService } from '../../services';

export const create = catchAsync(async (req, res) => {
  const { body } = req;
  const userId = req.user._id;
  const { appUsesType } = req.query;
  const options = {};
  const spam = await spamUserService.createSpam(
    {
      userId,
      ...body,
      appUsesType,
    },
    options
  );
  return res.status(httpStatus.CREATED).send({ results: spam });
});

export const list = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const spam = await spamUserService.getSpamList(filter, options);
  return res.status(httpStatus.OK).send({ results: spam });
});

export const update = catchAsync(async (req, res) => {
  const { body } = req;
  body.updatedBy = req.user;
  const { spamId } = req.params;
  const filter = {
    _id: spamId,
  };
  const options = { new: true };
  const spam = await spamUserService.updateSpam(filter, body, options);
  return res.status(httpStatus.OK).send({ results: spam });
});

export const remove = catchAsync(async (req, res) => {
  const { spamId } = req.params;
  const filter = {
    _id: spamId,
  };
  const spam = await spamUserService.removeSpam(filter);
  return res.status(httpStatus.OK).send({ results: spam });
});
