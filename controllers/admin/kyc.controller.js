import httpStatus from 'http-status';
import { KycService } from 'services';
import { catchAsync } from 'utils/catchAsync';
import { pick } from '../../utils/pick';

export const get = catchAsync(async (req, res) => {
  const { KycId } = req.params;
  const filter = {
    _id: KycId,
  };
  const options = {};
  const Kyc = await KycService.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: Kyc });
});

export const list = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const Kyc = await KycService.getkycList(filter, options);
  return res.status(httpStatus.OK).send({ results: Kyc });
});

export const paginate = catchAsync(async (req, res) => {
  const { query } = req;
  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = {
    [sortingObj.sort]: sortingObj.order,
  };
  const filter = {};
  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
  };
  const Kyc = await KycService.getkycListWithPagination(filter, options);
  return res.status(httpStatus.OK).send({ results: Kyc });
});

export const create = catchAsync(async (req, res) => {
  const { body } = req;
  body.createdBy = req.admin;
  body.updatedBy = req.admin;
  const options = {};
  const Kyc = await KycService.createkyc(body, options);
  return res.status(httpStatus.CREATED).send({ results: Kyc });
});

export const update = catchAsync(async (req, res) => {
  const { body } = req;
  body.updatedBy = req.admin;
  const { KycId } = req.params;
  const filter = {
    _id: KycId,
  };
  const options = { new: true };
  const Kyc = await KycService.updatekyc(filter, body, options);
  return res.status(httpStatus.OK).send({ results: Kyc });
});

export const remove = catchAsync(async (req, res) => {
  const { KycId } = req.params;
  const filter = {
    _id: KycId,
  };
  const Kyc = await KycService.removekyc(filter);
  return res.status(httpStatus.OK).send({ results: Kyc });
});

export const getKycByUserId = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const filter = {
    userId,
  };
  const options = {};
  const Kyc = await KycService.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: Kyc });
});
