import httpStatus from 'http-status';
import { educationservice, userService } from 'services';
import { catchAsync } from 'utils/catchAsync';

export const getUserEducationDetail = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const filter = {
    userId,
  };
  const options = {};
  const userEducationDetail = await educationservice.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: userEducationDetail });
});

export const listUserEducationDetail = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const userEducationDetail = await educationservice.getEducationList(filter, options);
  return res.status(httpStatus.OK).send({ results: userEducationDetail });
});

export const createUserEducationDetail = catchAsync(async (req, res) => {
  const { body } = req;
  const { user } = req;
  const userId = req.user._id;
  const options = {};
  const userEducation = await educationservice.createEducation({ userId, ...body }, options);
  await userService.updateUser({ _id: user.id }, { userEducation });
  return res.status(httpStatus.CREATED).send({ results: userEducation });
});

export const updateUserEducationDetail = catchAsync(async (req, res) => {
  const { body } = req;
  const { userEducationDetailId } = req.params;
  const filter = {
    _id: userEducationDetailId,
  };
  const options = { new: true };
  const userEducationDetail = await educationservice.updateEducation(filter, body, options);
  return res.status(httpStatus.OK).send({ results: userEducationDetail });
});

export const removeUserEducationDetail = catchAsync(async (req, res) => {
  const { userEducationDetailId } = req.params;
  const filter = {
    _id: userEducationDetailId,
  };
  const userEducationDetail = await educationservice.removeEducation(filter);
  return res.status(httpStatus.OK).send({ results: userEducationDetail });
});
