import httpStatus from 'http-status';
import { KycService, userService } from 'services';
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
  body.createdBy = req.user;
  body.updatedBy = req.user;
  const userId = req.user._id;
  body.isDocUpload = true;
  const options = {};
  const Kyc = await KycService.createkyc(
    {
      userId,
      ...body,
    },
    options
  );
  return res.status(httpStatus.CREATED).send({ results: Kyc });
});

export const update = catchAsync(async (req, res) => {
  const { body } = req;
  const { KycId } = req.params;
  const filter = {
    _id: KycId,
  };
  const { user } = req;
  body.updatedBy = user;

  // Fetch current KYC record
  const existingKyc = await KycService.getOne(filter);
  if (!existingKyc) {
    return res.status(httpStatus.NOT_FOUND).send({ message: 'KYC record not found' });
  }
  if (existingKyc.verify === false) {
    return res.status(httpStatus.FORBIDDEN).send({ message: 'KYC is not verified, name request cannot be processed.' });
  }
  if (
    (body.kycDocName && body.kycDocName !== existingKyc.kycDocName) ||
    (body.kycDocImagePath && body.kycDocImagePath !== existingKyc.kycDocImagePath)
  ) {
    if (!body.docUploadHistory) body.docUploadHistory = [];

    body.docUploadHistory.push({
      docName: body.kycDocName || existingKyc.kycDocName,
      docPath: body.kycDocImagePath || existingKyc.kycDocImagePath,
      uploadedAt: new Date(),
      uploadedBy: user._id,
    });
  }

  // ✅ Handle nameRequest logic
  if (body.nameRequest && body.nameRequest.length) {
    const latestRequest = body.nameRequest[body.nameRequest.length - 1];

    // If approved, update user's name
    if (latestRequest.approvalStatus === 'approved') {
      await userService.updateUser(
        { _id: existingKyc.userId },
        {
          firstName: latestRequest.firstName,
          lastName: latestRequest.lastName,
        }
      );

      // Set approvedAt and approvedBy
      latestRequest.approvedAt = new Date();
      latestRequest.approvedBy = user._id;
    }

    // Optional: Add requestedAt if not sent
    if (!latestRequest.requestedAt) {
      latestRequest.requestedAt = new Date();
    }
  }

  // ✅ Perform the update
  const options = { new: true };
  const updatedKyc = await KycService.updatekyc(filter, body, options);

  return res.status(httpStatus.OK).send({ results: updatedKyc });
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
  const Kyc = await KycService.getkycList(filter, options);
  return res.status(httpStatus.OK).send({ results: Kyc });
});
