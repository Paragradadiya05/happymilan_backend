import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { statusService } from '../../services';

export const create = catchAsync(async (req, res) => {
  const { body } = req;
  body.createdBy = req.user;
  body.updatedBy = req.user;
  const userId = req.user._id;
  const options = {};
  const story = await statusService.createStatus({ userId, content: body.content, caption: body.caption }, options);
  return res.status(httpStatus.CREATED).send({ results: story });
});

export const update = catchAsync(async (req, res) => {
  const { body } = req;
  body.updatedBy = req.user;
  const { statusId } = req.params;
  const filter = {
    _id: statusId,
  };
  const options = { new: true };
  const status = await statusService.updateStatus(filter, body, options);
  return res.status(httpStatus.OK).send({ results: status });
});

export const list = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const filter = {
    userId,
  };

  const options = {};
  const status = await statusService.getStatusList(filter, options);
  return res.status(httpStatus.OK).send({ results: status });
});

// export const allList = catchAsync(async (req, res) => {
//   const filter = {};
//   const options = {};
//   const status = await statusService.getStatusList(filter, options);
//   return res.status(httpStatus.OK).send({ results: status });
// });

export const allList = catchAsync(async (req, res) => {
  const userId = req.user._id; // Assuming user ID is stored in req.user._id
  const options = {};
  const status = await statusService.getStatusListFrd(userId, options);
  return res.status(httpStatus.OK).send({ results: status });
});
export const remove = catchAsync(async (req, res) => {
  const { statusId } = req.params;
  const filter = {
    _id: statusId,
  };
  const status = await statusService.removeStatus(filter);
  return res.status(httpStatus.OK).send({ results: status });
});
