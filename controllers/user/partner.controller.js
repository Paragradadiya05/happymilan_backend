import httpStatus from 'http-status';
import { partnerservice, userService } from 'services';
import { catchAsync } from 'utils/catchAsync';

export const getPartner = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const filter = {
    userId,
  };
  const options = {};
  const partner = await partnerservice.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: partner });
});

export const listPartner = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const Partner = await partnerservice.getPartnerList(filter, options);
  return res.status(httpStatus.OK).send({ results: Partner });
});

export const createPartner = catchAsync(async (req, res) => {
  const { body } = req;
  const { user } = req;
  const userId = req.user._id;
  const options = {};
  const userPartner = await partnerservice.createPartner(
    {
      userId,
      ...body,
    },
    options
  );
  await userService.updateUser({ _id: user.id }, { userPartner });
  return res.status(httpStatus.CREATED).send({ results: userPartner });
});

export const updatePartner = catchAsync(async (req, res) => {
  const { body } = req;
  const { PartnerId } = req.params;
  const filter = {
    _id: PartnerId,
  };
  const options = { new: true };
  const Partner = await partnerservice.updatePartner(filter, body, options);
  return res.status(httpStatus.OK).send({ results: Partner });
});

export const removePartner = catchAsync(async (req, res) => {
  const { PartnerId } = req.params;
  const filter = {
    _id: PartnerId,
  };
  const Partner = await partnerservice.removePartner(filter);
  return res.status(httpStatus.OK).send({ results: Partner });
});

export const getPartnerById = catchAsync(async (req, res) => {
  const { PartnerId } = req.params;
  const filter = {
    _id: PartnerId,
  };
  const options = {};
  const partner = await partnerservice.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: partner });
});
