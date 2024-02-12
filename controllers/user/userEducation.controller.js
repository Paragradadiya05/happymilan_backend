import httpStatus from 'http-status';
import { educationservice } from 'services';
import { catchAsync } from 'utils/catchAsync';

export const getUserEducationDetail = catchAsync(async (req, res) => {
  const { userEducationDetailId } = req.params;
  const filter = {
    _id: userEducationDetailId,
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
  const options = {};
  const userEducationDetail = await educationservice.createEducation(body, options);
  return res.status(httpStatus.CREATED).send({ results: userEducationDetail });
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
