import httpStatus from 'http-status';
import { DatingpartnerService, userService } from 'services';
import { catchAsync } from 'utils/catchAsync';

export const getPartner = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const filter = {
    userId,
  };
  const options = {};
  const userDatingPartner = await DatingpartnerService.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: userDatingPartner });
});

export const listPartner = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const userDatingPartner = await DatingpartnerService.getPartnerList(filter, options);
  return res.status(httpStatus.OK).send({ results: userDatingPartner });
});

export const createPartner = catchAsync(async (req, res) => {
  const { body } = req;
  const { user } = req;
  const userId = req.user._id;
  const options = {};
  const userDatingPartner = await DatingpartnerService.createPartner(
    {
      userId,
      ...body,
    },
    options
  );
  await userService.updateUser({ _id: user.id }, { userPartnerPrefForDating: userDatingPartner._id });
  return res.status(httpStatus.CREATED).send({ results: userDatingPartner });
});

export const updatePartner = catchAsync(async (req, res) => {
  const { body } = req;
  const { PartnerId } = req.params;
  const filter = {
    _id: PartnerId,
  };
  const options = { new: true };
  const userDatingPartner = await DatingpartnerService.updatePartner(filter, body, options);
  return res.status(httpStatus.OK).send({ results: userDatingPartner });
});

export const removePartner = catchAsync(async (req, res) => {
  const { PartnerId } = req.params;
  const filter = {
    _id: PartnerId,
  };
  const userDatingPartner = await DatingpartnerService.removePartner(filter);
  return res.status(httpStatus.OK).send({ results: userDatingPartner });
});

export const getPartnerById = catchAsync(async (req, res) => {
  const { PartnerId } = req.params;
  const filter = {
    _id: PartnerId,
  };
  const options = {};
  const userDatingPartner = await DatingpartnerService.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: userDatingPartner });
});
