import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import ApiError from '../../utils/ApiError';
import { MobileNumberRequest, Notification, User } from '../../models';
import { sendNotification } from '../../services/notification.service';
import { creditService } from '../../services';

const MOBILE_REQUEST_COST = 5; // Fixed cost for mobile number request

/**
 * Create a mobile number request
 */
export const createMobileNumberRequest = catchAsync(async (req, res) => {
  const { targetUserId } = req.body;
  const requesterId = req.user._id;

  // Check if requester has enough credits
  const hasEnoughCredits = await creditService.hasSufficientCredits(requesterId, MOBILE_REQUEST_COST);
  if (!hasEnoughCredits) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Insufficient credits. You need ${MOBILE_REQUEST_COST} credits to request a mobile number.`
    );
  }

  // Check if there's already a pending request
  const existingRequest = await MobileNumberRequest.findOne({
    requesterId,
    targetUserId,
    status: 'pending',
  });

  if (existingRequest) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You already have a pending request for this user');
  }

  // Check if there's already an accepted request
  const acceptedRequest = await MobileNumberRequest.findOne({
    requesterId,
    targetUserId,
    status: 'accepted',
  });

  if (acceptedRequest) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You already have access to this user's mobile number");
  }

  // Create the request
  const mobileRequest = await MobileNumberRequest.create({
    requesterId,
    targetUserId,
    status: 'pending',
  });

  const populatedRequest = await MobileNumberRequest.findById(mobileRequest._id)
    .populate('requesterId', 'fullName email profilePhoto')
    .populate('targetUserId', 'fullName email');

  // Send notification to target user
  try {
    const requesterUser = await User.findById(requesterId).select('fullName name deviceTokens');
    const targetUser = await User.findById(targetUserId).select('deviceTokens');

    const requesterName = requesterUser.fullName || requesterUser.name || 'Someone';

    // Create notification in database
    const notificationData = await Notification.create({
      userId: targetUserId,
      otherUserId: requesterId,
      userName: requesterName,
      body: `${requesterName} requested your mobile number`,
      title: 'Mobile Number Request',
      screen: 'MobileNumberRequests',
    });

    // Send push notification if user has device tokens
    if (targetUser && targetUser.deviceTokens && targetUser.deviceTokens.length > 0) {
      await Promise.all(
        targetUser.deviceTokens.map(async (fcmToken) => {
          await sendNotification(
            fcmToken.deviceToken,
            {
              data: {
                _id: notificationData._id.toString(),
                userId: notificationData.userId.toString(),
                otherUserId: notificationData.otherUserId.toString(),
                body: `${requesterName} requested your mobile number`,
                title: 'Mobile Number Request',
                createdAt: notificationData.createdAt.toString(),
                updatedAt: notificationData.updatedAt.toString(),
                screen: 'MobileNumberRequests',
                type: 'mobile_number_request',
                requestId: mobileRequest._id.toString(),
              },
            },
            {}
          );
        })
      );
    }
  } catch (notificationError) {
    // Log error but don't fail the request creation
    console.error('Failed to send mobile number request notification:', notificationError);
  }

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

  // Find the request
  const mobileRequest = await MobileNumberRequest.findById(requestId)
    .populate('requesterId', 'fullName email')
    .populate('targetUserId', 'fullName email mobileNumber');

  if (!mobileRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Mobile number request not found');
  }

  // Verify the current user is the target user
  if (mobileRequest.targetUserId._id.toString() !== targetUserId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only accept requests sent to you');
  }

  // Check if request is still pending
  if (mobileRequest.status !== 'pending') {
    throw new ApiError(httpStatus.BAD_REQUEST, `Request is already ${mobileRequest.status}`);
  }

  // Check if requester still has enough credits
  const hasEnoughCredits = await creditService.hasSufficientCredits(mobileRequest.requesterId._id, MOBILE_REQUEST_COST);
  if (!hasEnoughCredits) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Requester no longer has sufficient credits for this request');
  }

  // Deduct credits using credit service (atomic operation with validation)
  try {
    await creditService.deductCredits({
      userId: mobileRequest.requesterId._id,
      amount: MOBILE_REQUEST_COST,
      reason: 'Mobile Number Request',
      notes: `Mobile number request accepted by ${mobileRequest.targetUserId.fullName || 'User'}`,
    });
  } catch (creditError) {
    throw new ApiError(httpStatus.BAD_REQUEST, creditError.message || 'Failed to deduct credits');
  }

  // Update request status
  mobileRequest.status = 'accepted';
  mobileRequest.acceptedAt = new Date();
  mobileRequest.creditDeducted = MOBILE_REQUEST_COST;
  await mobileRequest.save();

  // Send notification to requester about acceptance
  try {
    const requesterUser = await User.findById(mobileRequest.requesterId._id).select('deviceTokens');
    const targetUserName = mobileRequest.targetUserId.fullName || mobileRequest.targetUserId.name || 'User';

    // Create notification in database
    const notificationData = await Notification.create({
      userId: mobileRequest.requesterId._id,
      otherUserId: mobileRequest.targetUserId._id,
      userName: targetUserName,
      body: `${targetUserName} accepted your mobile number request`,
      title: 'Request Accepted',
      screen: 'MobileNumberRequests',
    });

    // Send push notification if requester has device tokens
    if (requesterUser && requesterUser.deviceTokens && requesterUser.deviceTokens.length > 0) {
      await Promise.all(
        requesterUser.deviceTokens.map(async (fcmToken) => {
          await sendNotification(
            fcmToken.deviceToken,
            {
              data: {
                _id: notificationData._id.toString(),
                userId: notificationData.userId.toString(),
                otherUserId: notificationData.otherUserId.toString(),
                body: `${targetUserName} accepted your mobile number request`,
                title: 'Request Accepted',
                createdAt: notificationData.createdAt.toString(),
                updatedAt: notificationData.updatedAt.toString(),
                screen: 'MobileNumberRequests',
                type: 'mobile_number_request_accepted',
                requestId: mobileRequest._id.toString(),
                mobileNumber: mobileRequest.targetUserId.mobileNumber,
              },
            },
            {}
          );
        })
      );
    }
  } catch (notificationError) {
    // Log error but don't fail the acceptance
    console.error('Failed to send mobile number request acceptance notification:', notificationError);
  }

  return res.status(httpStatus.OK).send({
    message: 'Mobile number request accepted successfully',
    results: {
      requestId: mobileRequest._id,
      status: mobileRequest.status,
      acceptedAt: mobileRequest.acceptedAt,
      creditDeducted: MOBILE_REQUEST_COST,
      mobileNumber: mobileRequest.targetUserId.mobileNumber,
    },
  });
});

/**
 * Reject a mobile number request
 */
export const rejectMobileNumberRequest = catchAsync(async (req, res) => {
  const { requestId } = req.params;
  const targetUserId = req.user._id;

  // Find the request
  const mobileRequest = await MobileNumberRequest.findById(requestId)
    .populate('requesterId', 'fullName email')
    .populate('targetUserId', 'fullName email');

  if (!mobileRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Mobile number request not found');
  }

  // Verify the current user is the target user
  if (mobileRequest.targetUserId._id.toString() !== targetUserId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only reject requests sent to you');
  }

  // Check if request is still pending
  if (mobileRequest.status !== 'pending') {
    throw new ApiError(httpStatus.BAD_REQUEST, `Request is already ${mobileRequest.status}`);
  }

  // Update request status
  mobileRequest.status = 'rejected';
  mobileRequest.rejectedAt = new Date();
  await mobileRequest.save();

  // Send notification to requester about rejection
  try {
    const requesterUser = await User.findById(mobileRequest.requesterId._id).select('deviceTokens');
    const targetUserName = mobileRequest.targetUserId.fullName || mobileRequest.targetUserId.name || 'User';

    // Create notification in database
    const notificationData = await Notification.create({
      userId: mobileRequest.requesterId._id,
      otherUserId: mobileRequest.targetUserId._id,
      userName: targetUserName,
      body: `${targetUserName} declined your mobile number request`,
      title: 'Request Declined',
      screen: 'MobileNumberRequests',
    });

    // Send push notification if requester has device tokens
    if (requesterUser && requesterUser.deviceTokens && requesterUser.deviceTokens.length > 0) {
      await Promise.all(
        requesterUser.deviceTokens.map(async (fcmToken) => {
          await sendNotification(
            fcmToken.deviceToken,
            {
              data: {
                _id: notificationData._id.toString(),
                userId: notificationData.userId.toString(),
                otherUserId: notificationData.otherUserId.toString(),
                body: `${targetUserName} declined your mobile number request`,
                title: 'Request Declined',
                createdAt: notificationData.createdAt.toString(),
                updatedAt: notificationData.updatedAt.toString(),
                screen: 'MobileNumberRequests',
                type: 'mobile_number_request_rejected',
                requestId: mobileRequest._id.toString(),
              },
            },
            {}
          );
        })
      );
    }
  } catch (notificationError) {
    // Log error but don't fail the rejection
    console.error('Failed to send mobile number request rejection notification:', notificationError);
  }

  return res.status(httpStatus.OK).send({
    message: 'Mobile number request rejected successfully',
    results: {
      requestId: mobileRequest._id,
      status: mobileRequest.status,
      rejectedAt: mobileRequest.rejectedAt,
    },
  });
});

/**
 * Get mobile number requests received by current user
 */
export const getReceivedRequests = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10, status } = req.query;

  const filter = { targetUserId: userId };
  if (status) {
    filter.status = status;
  }

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 },
    populate: [
      { path: 'requesterId', select: 'fullName email profilePhoto' },
      { path: 'targetUserId', select: 'fullName email mobileNumber' },
    ],
  };

  const requests = await MobileNumberRequest.paginate(filter, options);

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

  const filter = { requesterId: userId };
  if (status) {
    filter.status = status;
  }

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 },
    populate: [
      { path: 'requesterId', select: 'fullName email' },
      { path: 'targetUserId', select: 'fullName email profilePhoto' },
    ],
  };

  const requests = await MobileNumberRequest.paginate(filter, options);

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

  const filter = {
    requesterId: userId,
    status: 'accepted',
  };

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { acceptedAt: -1 },
    populate: [{ path: 'targetUserId', select: 'fullName email mobileNumber profilePhoto' }],
  };

  const requests = await MobileNumberRequest.paginate(filter, options);

  return res.status(httpStatus.OK).send({
    message: 'Accessible mobile numbers fetched successfully',
    results: requests,
  });
});
