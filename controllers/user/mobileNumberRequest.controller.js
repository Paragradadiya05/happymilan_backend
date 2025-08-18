import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { mobileNumberRequestService } from '../../services';

/**
 * Create a mobile number request
 */
export const createMobileNumberRequest = catchAsync(async (req, res) => {
  const { targetUserId } = req.body;
  const requesterId = req.user._id;

  const populatedRequest = await mobileNumberRequestService.createMobileNumberRequest(requesterId, targetUserId);

  return res.status(httpStatus.CREATED).send({
    message: 'Mobile number request created successfully',
    results: populatedRequest,
  });
});

/**
 * Accept a mobile number request
 */
export const acceptMobileNumberRequest = catchAsync(async (req, res) => {
  const { requestId } = req.params;
  const targetUserId = req.user._id;

  const result = await mobileNumberRequestService.acceptMobileNumberRequest(requestId, targetUserId);

  return res.status(httpStatus.OK).send({
    message: 'Mobile number request accepted successfully',
    results: result,
  });
});

/**
 * Reject a mobile number request
 */
export const rejectMobileNumberRequest = catchAsync(async (req, res) => {
  const { requestId } = req.params;
  const targetUserId = req.user._id;

  const result = await mobileNumberRequestService.rejectMobileNumberRequest(requestId, targetUserId);

  return res.status(httpStatus.OK).send({
    message: 'Mobile number request rejected successfully',
    results: result,
  });
});

/**
 * Get mobile number requests received by current user
 */
export const getReceivedRequests = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10, status } = req.query;

  const requests = await mobileNumberRequestService.getReceivedRequests(userId, {
    page,
    limit,
    status,
  });

  return res.status(httpStatus.OK).send({
    message: 'Received requests fetched successfully',
    results: requests,
  });
});

/**
 * Get mobile number requests sent by current user
 */
export const getSentRequests = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10, status } = req.query;

  const requests = await mobileNumberRequestService.getSentRequests(userId, {
    page,
    limit,
    status,
  });

  return res.status(httpStatus.OK).send({
    message: 'Sent requests fetched successfully',
    results: requests,
  });
});

/**
 * Get accepted mobile numbers (numbers the user has access to)
 */
export const getAccessibleMobileNumbers = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  const requests = await mobileNumberRequestService.getAccessibleMobileNumbers(userId, {
    page,
    limit,
  });

  return res.status(httpStatus.OK).send({
    message: 'Accessible mobile numbers fetched successfully',
    results: requests,
  });
});
