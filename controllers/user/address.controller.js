import httpStatus from 'http-status';
import { addressService } from 'services';
import { catchAsync } from 'utils/catchAsync';

export const getAddress = catchAsync(async (req, res) => {
  const { addressId } = req.params;
  const filter = {
    _id: addressId,
  };
  const options = {};
  const address = await addressService.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: address });
});

export const listAddress = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const address = await addressService.getAddressList(filter, options);
  return res.status(httpStatus.OK).send({ results: address });
});

export const paginateAddress = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const addresh = await addressService.getAddressListWithPagination(filter, options);
  return res.status(httpStatus.OK).send({ results: addresh });
});

export const createAddress = catchAsync(async (req, res) => {
  const { body } = req;
  const userId = req.user._id;
  const options = {};
  const address = await addressService.createAddress(
    {
      userId,
      ...body,
    },
    options
  );
  return res.status(httpStatus.CREATED).send({ results: address });
});

export const updateAddress = catchAsync(async (req, res) => {
  const { body } = req;
  const { addressId } = req.params;
  const filter = {
    _id: addressId,
  };
  const options = { new: true };
  const address = await addressService.updateAddress(filter, body, options);
  return res.status(httpStatus.OK).send({ results: address });
});

export const removeAddress = catchAsync(async (req, res) => {
  const { addressId } = req.params;
  const filter = {
    _id: addressId,
  };
  const address = await addressService.removeAddresh(filter);
  return res.status(httpStatus.OK).send({ results: address });
});
