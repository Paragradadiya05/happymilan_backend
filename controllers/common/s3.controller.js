import httpStatus from 'http-status';
import { catchAsync } from 'utils/catchAsync';
import { s3Service } from 'services';
import axios from 'axios';
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

  const mailAttachments = [];

  if (attachments.content) {
    try {
      // ✅ Download PDF from the given URL
      const response = await axios.get(attachments.content, {
        responseType: 'arraybuffer',
      });

      mailAttachments.push({
        filename: attachments.filename,
        content: Buffer.from(response.data), // ✅ Attach actual PDF binary
      });
    } catch (error) {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: 'Failed to download attachment from provided URL',
        error: error.message,
      });
    }
  }

  const emailSendBody = {
    from: emailAddresh,
    to: 'mntechgroup2@gmail.com',
    subject: projectDescription,
    html: `
      <b>Name:</b> ${name}<br/>
      <b>Contact No:</b> ${contactNo}<br/>
      <b>Project Description:</b> ${projectDescription}<br/>
      ${help ? `<b>Help Needed:</b> ${help}<br/>` : ''}
      ${Budget !== undefined ? `<b>Budget:</b> ₹${Budget}<br/>` : ''}
    `,
    attachments: mailAttachments,
  };

  const s3PutObject = await sendMail(emailSendBody);
  return res.status(httpStatus.OK).send({ results: s3PutObject });
});
export const UploadStoryImg = catchAsync(async (req, res) => {
  const { body, user } = req;
  const s3PutObject = await s3Service.validateExtensionForPutObjectForStory(body, user);
  return res.status(httpStatus.OK).send({ results: s3PutObject });
});

export const ApplyInternship = catchAsync(async (req, res) => {
  const { fullname, emailOrMobile, description, attachments } = req.body;

  const mailAttachments = [];

  if (attachments.content) {
    try {
      const response = await axios.get(attachments.content, {
        responseType: 'arraybuffer',
      });

      mailAttachments.push({
        filename: attachments.filename,
        content: Buffer.from(response.data),
      });
    } catch (error) {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: 'Could not download PDF from given URL',
        error: error.message,
      });
    }
  }

  const emailBody = {
    from: typeof emailOrMobile === 'string' && emailOrMobile.includes('@') ? emailOrMobile : 'internship-form@your-site.com',
    to: 'mntechgroup2@gmail.com',
    subject: `Internship Application – ${fullname}`,
    html: `
      <b>Name:</b> ${fullname}<br/>
      <b>Email / Mobile:</b> ${emailOrMobile}<br/>
      <b>Description:</b><br/>${description.replace(/\n/g, '<br/>')}
    `,
    attachments: mailAttachments,
  };

  const mailResult = await sendMail(emailBody);
  return res.status(httpStatus.OK).send({ results: mailResult });
});
export const csrInitiative = catchAsync(async (req, res) => {
  const { fullName, emailOrMobile, organizationName, roleOrDesignation, areaOfInterest, contribute, agreeToBeContacted } =
    req.body;

  const emailSendBody = {
    from: emailOrMobile,
    to: 'mntechgroup2@gmail.com',
    subject: 'CSR Initiative Application',
    html: `
      <b>Full Name:</b> ${fullName}<br/>
      <b>Email or Mobile:</b> ${emailOrMobile}<br/>
      <b>Organization Name:</b> ${organizationName}<br/>
      <b>Role/Designation:</b> ${roleOrDesignation}<br/>
      <b>Area of Interest:</b> ${areaOfInterest}<br/>
      <b>Contribution:</b> ${contribute}<br/>
      <b>Agreed to be contacted:</b> ${agreeToBeContacted ? 'Yes' : 'No'}<br/>
    `,
  };

  const s3PutObject = await sendMail(emailSendBody);
  return res.status(httpStatus.OK).send({ results: s3PutObject });
});

export const UploadClaimDoc = catchAsync(async (req, res) => {
  const { body, user } = req;
  const s3PutObject = await s3Service.validateExtensionForPutObjectForClaimDoc(body, user);
  return res.status(httpStatus.OK).send({ results: s3PutObject });
});
