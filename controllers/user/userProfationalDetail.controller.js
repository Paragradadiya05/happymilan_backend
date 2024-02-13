import httpStatus from 'http-status';
import { userProfessionalDetailService, userService } from 'services';
import { catchAsync } from 'utils/catchAsync';

export const getUserProfessionalDetail = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const filter = {
    userId,
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
  const { user } = req;
  const userId = req.user._id;
  const options = {};
  const userProfessional = await userProfessionalDetailService.createUserProfessionalDetail({ userId, ...body }, options);
  await userService.updateUser({ _id: user.id }, { userProfessional });
  return res.status(httpStatus.CREATED).send({ results: userProfessional });
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
