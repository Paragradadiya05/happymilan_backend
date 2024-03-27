import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { statusService } from '../../services';

export const create = catchAsync(async (req, res) => {
  const { body } = req;
  body.createdBy = req.user;
  body.updatedBy = req.user;
  const userId = req.user._id;
  const options = {};
  const story = await statusService.createStatus({ userId, content: body.content }, options);
  return res.status(httpStatus.CREATED).send({ results: story });
});
export const list = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const filter = {
    userId,
  };

  const options = {};
  const story = await statusService.getStatusList(filter, options);
  return res.status(httpStatus.OK).send({ results: story });
});
