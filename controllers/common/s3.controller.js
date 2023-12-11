import httpStatus from 'http-status';
import { catchAsync } from 'utils/catchAsync';
import { s3Service } from 'services';
import { sendMail } from '../../utils/sendMailMnteh';
// eslint-disable-next-line import/prefer-default-export
export const preSignedPutUrl = catchAsync(async (req, res) => {
  const { body, user } = req;
  const s3PutObject = await s3Service.validateExtensionForPutObject(body, user);
  return res.status(httpStatus.OK).send({ results: s3PutObject });
});

export const preSignedPutUrlv2 = catchAsync(async (req, res) => {
  const { body, user } = req;
  const s3PutObject = await s3Service.validateExtensionForPutObjectv2(body, user);
  return res.status(httpStatus.OK).send({ results: s3PutObject });
});

export const sendProposal = catchAsync(async (req, res) => {
  const s3PutObject = await sendMail(req.body);
  return res.status(httpStatus.OK).send({ results: s3PutObject });
});
