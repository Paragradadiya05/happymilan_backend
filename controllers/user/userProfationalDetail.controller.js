import httpStatus from 'http-status';
import { userProfessionalDetailService } from 'services';
import { catchAsync } from 'utils/catchAsync';

export const getUserProfessionalDetail = catchAsync(async (req, res) => {
  const { userProfessionalDetailId } = req.params;
  const filter = {
    _id: userProfessionalDetailId,
  };
  const options = {};
  const userProfessionalDetail = await userProfessionalDetailService.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: userProfessionalDetail });
});

export const listUserProfessionalDetail = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const userProfessionalDetail = await userProfessionalDetailService.getUserProfessionalDetailList(filter, options);
  return res.status(httpStatus.OK).send({ results: userProfessionalDetail });
});

export const paginateUserProfessionalDetail = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const userProfessionalDetail = await userProfessionalDetailService.getUserProfessionalDetailListWithPagination(
    filter,
    options
  );
  return res.status(httpStatus.OK).send({ results: userProfessionalDetail });
});

export const createUserProfessionalDetail = catchAsync(async (req, res) => {
  const { body } = req;
  const options = {};
  const userProfessionalDetail = await userProfessionalDetailService.createUserProfessionalDetail(body, options);
  return res.status(httpStatus.CREATED).send({ results: userProfessionalDetail });
});

export const updateUserProfessionalDetail = catchAsync(async (req, res) => {
  const { body } = req;
  const { userProfessionalDetailId } = req.params;
  const filter = {
    _id: userProfessionalDetailId,
  };
  const options = { new: true };
  const userProfessionalDetail = await userProfessionalDetailService.updateUserProfessionalDetail(filter, body, options);
  return res.status(httpStatus.OK).send({ results: userProfessionalDetail });
});

export const removeUserProfessionalDetail = catchAsync(async (req, res) => {
  const { userProfessionalDetailId } = req.params;
  const filter = {
    _id: userProfessionalDetailId,
  };
  const userProfessionalDetail = await userProfessionalDetailService.removeUserProfessionalDetail(filter);
  return res.status(httpStatus.OK).send({ results: userProfessionalDetail });
});
