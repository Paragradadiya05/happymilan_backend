import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { pravicyservice } from '../../services';

export const create = catchAsync(async (req, res) => {
  const { body } = req;
  const options = {};
  const privacy = await pravicyservice.createPrivacy(body, options);
  return res.status(httpStatus.CREATED).send({ results: privacy });
});

export const list = catchAsync(async (req, res) => {
  const options = {};
  const filter = {};
  const privacy = await pravicyservice.getPrivacy(filter, options);
  return res.status(httpStatus.OK).send({ results: privacy });
});

export const getUserPrivacyQuestion = catchAsync(async (req, res) => {
  const options = {};
  const { user } = req;
  const filter = {
    userId: user,
  };
  const privacy = await pravicyservice.getPrivacy(filter, options);
  return res.status(httpStatus.OK).send({ results: privacy });
});

export const update = catchAsync(async (req, res) => {
  const { body } = req;
  body.updatedBy = req.user;
  const { privacyId } = req.params;
  const filter = {
    _id: privacyId,
  };
  const options = { new: true };
  console.log('=== var name = body ==>', body);
  const privacy = await pravicyservice.updatePrivacy(filter, body, options);
  return res.status(httpStatus.OK).send({ results: privacy });
});
