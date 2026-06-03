import httpStatus from 'http-status';
import { MobileNumberRequest, User, Notification } from 'models';
import ApiError from 'utils/ApiError';
import { sendNotification } from './notification.service';
import { creditService } from './index';

const MOBILE_REQUEST_COST = 1; // Fixed cost for mobile number request
// eslint-disable-next-line import/prefer-default-export
export const createMobileNumberRequest = async (requesterId, targetUserId) => {
  // const hasEnoughCredits = await creditService.hasSufficientCredits(requesterId, MOBILE_REQUEST_COST);
  // if (!hasEnoughCredits) {
  //   throw new ApiError(
  //     httpStatus.BAD_REQUEST,
  //     `Insufficient credits. You need ${MOBILE_REQUEST_COST} credits to request a mobile number.`
  //   );
  // }
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

  // Send notification (do not throw if fails)
  try {
    const requesterUser = await User.findById(requesterId).select('fullName name deviceTokens');
    const targetUser = await User.findById(targetUserId).select('deviceTokens');

    const requesterName = requesterUser.fullName || requesterUser.name || 'Someone';

    const notificationData = await Notification.create({
      userId: targetUserId,
      otherUserId: requesterId,
      userName: requesterName,
      body: `${requesterName} requested your mobile number`,
      reqId: mobileRequest._id.toString(),
      title: 'Mobile Number Request',
      screen: 'MobileNumberRequests',
    });

    if (targetUser.deviceTokens.length > 0) {
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
                reqId: mobileRequest._id.toString(),
              },
            },
            {}
          );
        })
      );
    }
  } catch (err) {
    console.error('Failed to send mobile number request notification:', err);
  }

  return populatedRequest;
};

export const acceptMobileNumberRequest = async (requestId, targetUserId) => {
  const mobileRequest = await MobileNumberRequest.findById(requestId)
    .populate('requesterId', 'fullName email')
    .populate('targetUserId', 'fullName email mobileNumber');

  if (!mobileRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Mobile number request not found');
  }

  if (mobileRequest.targetUserId._id.toString() !== targetUserId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only accept requests sent to you');
  }

  if (mobileRequest.status !== 'pending') {
    throw new ApiError(httpStatus.BAD_REQUEST, `Request is already ${mobileRequest.status}`);
  }

  // Deduct credits if needed in future using creditService
  await creditService.deductCredits({
    userId: mobileRequest.requesterId._id,
    amount: MOBILE_REQUEST_COST,
    reason: 'Mobile Number Request',
    notes: `Deducted ${MOBILE_REQUEST_COST} credits for mobile number request acceptance`,
  });

  mobileRequest.status = 'accepted';
  mobileRequest.acceptedAt = new Date();
  mobileRequest.creditDeducted = MOBILE_REQUEST_COST;
  await mobileRequest.save();

  try {
    const requesterUser = await User.findById(mobileRequest.requesterId._id).select('deviceTokens');
    const targetUserName = mobileRequest.targetUserId.fullName || mobileRequest.targetUserId.name || 'User';
    await Notification.findOneAndUpdate(
      {
        reqId: mobileRequest._id.toString(), // match the same request
        userId: mobileRequest.targetUserId._id, // notification originally sent to targetUser
        otherUserId: mobileRequest.requesterId._id,
        screen: 'MobileNumberRequests',
      },
      {
        $set: {
          title: 'Request Accepted',
          body: `${targetUserName} accepted your mobile number request`,
          type: 'mobile_number_request_accepted',
          updatedAt: new Date(),
        },
      }
    );
    const notificationData = await Notification.create({
      userId: mobileRequest.requesterId._id,
      otherUserId: mobileRequest.targetUserId._id,
      userName: targetUserName,
      body: `${targetUserName} accepted your mobile number request`,
      title: 'Request Accepted',
      screen: 'MobileNumberRequests',
    });

    if (requesterUser.deviceTokens.length > 0) {
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
    console.error('Failed to send mobile number request acceptance notification:', notificationError);
  }

  return {
    requestId: mobileRequest._id,
    status: mobileRequest.status,
    acceptedAt: mobileRequest.acceptedAt,
    creditDeducted: MOBILE_REQUEST_COST,
    mobileNumber: mobileRequest.targetUserId.mobileNumber,
  };
};

export const rejectMobileNumberRequest = async (requestId, targetUserId) => {
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

  try {
    const requesterUser = await User.findById(mobileRequest.requesterId._id).select('deviceTokens');
    const targetUserName = mobileRequest.targetUserId.fullName || mobileRequest.targetUserId.name || 'User';

    // Update the original notification (sent when request was created)
    await Notification.findOneAndUpdate(
      {
        reqId: mobileRequest._id.toString(),
        userId: mobileRequest.targetUserId._id,
        otherUserId: mobileRequest.requesterId._id,
        screen: 'MobileNumberRequests',
      },
      {
        $set: {
          title: 'Request Rejected',
          body: `${targetUserName} rejected your mobile number request`,
          type: 'mobile_number_request_rejected',
          updatedAt: new Date(),
        },
      }
    );

    // Create a new notification for requester (optional, just like accept)
    const notificationData = await Notification.create({
      userId: mobileRequest.requesterId._id,
      otherUserId: mobileRequest.targetUserId._id,
      userName: targetUserName,
      body: `${targetUserName} rejected your mobile number request`,
      title: 'Request Rejected',
      screen: 'MobileNumberRequests',
    });

    if (requesterUser.deviceTokens.length > 0) {
      await Promise.all(
        requesterUser.deviceTokens.map(async (fcmToken) => {
          await sendNotification(
            fcmToken.deviceToken,
            {
              data: {
                _id: notificationData._id.toString(),
                userId: notificationData.userId.toString(),
                otherUserId: notificationData.otherUserId.toString(),
                body: `${targetUserName} rejected your mobile number request`,
                title: 'Request Rejected',
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
    console.error('Failed to send mobile number request rejection notification:', notificationError);
  }

  return {
    requestId: mobileRequest._id,
    status: mobileRequest.status,
    rejectedAt: mobileRequest.rejectedAt,
  };
};

/**
 * Get received mobile number requests for a user with pagination
 * @param {string} userId - Target user ID
 * @param {Object} options - Pagination and filter options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=10] - Items per page
 * @param {string} [options.status] - Filter by status (pending/accepted/rejected)
 * @returns {Promise<Object>} Paginated requests
 */
export const getReceivedRequests = async (userId, { page = 1, limit = 10, status }) => {
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

  return MobileNumberRequest.paginate(filter, options);
};

/**
 * Get sent mobile number requests for a user with pagination
 * @param {string} userId - Requester user ID
 * @param {Object} options - Pagination and filter options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=10] - Items per page
 * @param {string} [options.status] - Filter by status (pending/accepted/rejected)
 * @returns {Promise<Object>} Paginated requests
 */
export const getSentRequests = async (userId, { page = 1, limit = 10, status }) => {
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

  return MobileNumberRequest.paginate(filter, options);
};

/**
 * Get all accepted requests where the user can access mobile numbers
 * @param {string} userId - Requester user ID
 * @param {Object} options - Pagination options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=10] - Items per page
 * @returns {Promise<Object>} Paginated requests
 */
export const getAccessibleMobileNumbers = async (userId, { page = 1, limit = 10 }) => {
  const filter = {
    requesterId: userId,
    status: 'accepted',
  };

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { acceptedAt: -1 },
    populate: [
      {
        path: 'targetUserId',
        select: 'fullName email mobileNumber profilePhoto',
      },
    ],
  };

  return MobileNumberRequest.paginate(filter, options);
};

export const getAccessibleMobileNumbersById = async ({ page = 1, limit = 10, targetUserId }) => {
  const filter = {
    status: 'accepted',
  };

  if (targetUserId) {
    filter.targetUserId = targetUserId; // only from params
  }

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { acceptedAt: -1 },
    populate: [
      {
        path: 'targetUserId',
        select: 'fullName email mobileNumber profilePhoto',
      },
    ],
  };

  return MobileNumberRequest.paginate(filter, options);
};
