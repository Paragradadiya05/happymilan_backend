import httpStatus from 'http-status';
import { catchAsync } from 'utils/catchAsync';
import { s3Service } from 'services';
import { sendMail } from '../../utils/sendMailMnteh';
// eslint-disable-next-line import/prefer-default-export
export const preSignedPutUrl = catchAsync(async (req, res) => {
  const { body, user } = req;
  const s3PutObject = await s3Service.validateExtensionForPutObject(body, user, body.isProfilePic, body.caption);
  return res.status(httpStatus.OK).send({ results: s3PutObject });
});

export const preSignedPutUrlv2 = catchAsync(async (req, res) => {
  const { body, user } = req;
  const s3PutObject = await s3Service.validateExtensionForPutObjectv2(body, user);
  return res.status(httpStatus.OK).send({ results: s3PutObject });
});
export const UploadKycDoc = catchAsync(async (req, res) => {
  const { body, user } = req;
  const s3PutObject = await s3Service.validateExtensionForPutObjectForKyc(body, user);
  return res.status(httpStatus.OK).send({ results: s3PutObject });
});

export const sendProposal = catchAsync(async (req, res) => {
  const emailSendBody = {
    from: req.body.emailAddresh,
    to: 'mntechgroup2@gmail.com',
    subject: req.body.projectDescription,
    html: `<b> name:  ${req.body.name}  contact no:  ${req.body.contactNo}  projectDescription : ${req.body.projectDescription}</b>`,
    attachments: [{ filename: req.body.filename, content: req.body.content }],
  };
  const s3PutObject = await sendMail(emailSendBody);
  return res.status(httpStatus.OK).send({ results: s3PutObject });
});

export const UploadStoryImg = catchAsync(async (req, res) => {
  const { body, user } = req;
  const s3PutObject = await s3Service.validateExtensionForPutObjectForStory(body, user);
  return res.status(httpStatus.OK).send({ results: s3PutObject });
});
