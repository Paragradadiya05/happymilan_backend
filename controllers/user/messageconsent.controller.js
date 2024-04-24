import httpStatus from 'http-status';
import { messageConsentservice } from 'services';
import { catchAsync } from 'utils/catchAsync';

export const create = catchAsync(async (req, res) => {
  const { body } = req;
  body.createdBy = req.user;
  body.updatedBy = req.user;
  const senderId = req.user._id;
  const options = {};
  const messageConsent = await messageConsentservice.createMessageConsent({ senderId, ...body }, options);
  return res.status(httpStatus.CREATED).send({ results: messageConsent });
});

export const update = catchAsync(async (req, res) => {
  const { body } = req;
  body.updatedBy = req.user;
  const { messageConsentId } = req.params;
  const filter = {
    _id: messageConsentId,
  };
  const options = { new: true };
  const messageConsent = await messageConsentservice.updateMessageConsent(filter, body, options);
  return res.status(httpStatus.OK).send({ results: messageConsent });
});

export const remove = catchAsync(async (req, res) => {
  const { messageConsentId } = req.params;
  const filter = {
    _id: messageConsentId,
  };
  const messageConsent = await messageConsentservice.removeMessageConsent(filter);
  return res.status(httpStatus.OK).send({ results: messageConsent });
});

export const list = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const messageConsent = await messageConsentservice.getMessageConsentList(filter, options);
  return res.status(httpStatus.OK).send({ results: messageConsent });
});

export const getConsent = catchAsync(async (req, res) => {
  const { receiverId } = req.params;
  const filter = {
    receiverId,
  };
  const options = {};
  const messageConsent = await messageConsentservice.getMessageConsentList(filter, options);
  return res.status(httpStatus.OK).send({ results: messageConsent });
});

export const getUserConsent = catchAsync(async (req, res) => {
  const senderId = req.user._id;
  const filter = {
    senderId,
  };
  console.log('=====xx====>', filter);
  const options = {};
  const messageConsent = await messageConsentservice.getMessageConsentList(filter, options);
  return res.status(httpStatus.OK).send({ results: messageConsent });
});
