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
  const { name, emailAddresh, contactNo, projectDescription, help, Budget, attachments } = req.body;

  const emailSendBody = {
    from: emailAddresh,
    to: 'mntechgroup2@gmail.com',
    subject: projectDescription,
    html: `
      <b>
        Name:</b> ${name}<br/>
      <b>Contact No:</b> ${contactNo}<br/>
      <b>Project Description:</b> ${projectDescription}<br/>
      ${help ? `<b>Help Needed:</b> ${help}<br/>` : ''}
      ${Budget !== undefined ? `<b>Budget:</b> ₹${Budget}<br/>` : ''}
    `,
    attachments: attachments ? [{ filename: attachments.filename, content: attachments.content }] : [],
  };

  const s3PutObject = await sendMail(emailSendBody);
  return res.status(httpStatus.OK).send({ results: s3PutObject });
});

export const UploadStoryImg = catchAsync(async (req, res) => {
  const { body, user } = req;
  const s3PutObject = await s3Service.validateExtensionForPutObjectForStory(body, user);
  return res.status(httpStatus.OK).send({ results: s3PutObject });
});
