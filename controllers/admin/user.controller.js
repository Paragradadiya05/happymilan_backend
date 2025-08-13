import httpStatus from 'http-status';
import {
  addressService,
  educationservice,
  emailService,
  tokenService,
  userProfessionalDetailService,
  userService,
  creditService,
} from 'services';
import { catchAsync } from 'utils/catchAsync';
import mongoose from 'mongoose';
import { pick } from '../../utils/pick';
import { generatePassword } from '../../utils/passwordGenerator';
import ApiError from '../../utils/ApiError';

export const get = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const filter = {
    _id: userId,
  };
  const options = {};
  const user = await userService.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: user });
});

export const getRole = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const filter = {
    _id: userId,
  };
  const options = {};
  const user = await userService.getOnerole(filter, options);
  return res.status(httpStatus.OK).send({ results: user });
});
export const list = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const user = await userService.getUserList(filter, options);
  return res.status(httpStatus.OK).send({ results: user });
});

export const listroles = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const user = await userService.getAdminAndOwnerUsers(filter, options);
  return res.status(httpStatus.OK).send({ results: user });
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
  const user = await userService.getUserListWithPagination(filter, options);
  return res.status(httpStatus.OK).send({ results: user });
});

export const create = catchAsync(async (req, res) => {
  const { body } = req;
  const options = {};
  const user = await userService.createUser(body, options);
  return res.status(httpStatus.CREATED).send({ results: user });
});

export const update = catchAsync(async (req, res) => {
  const { body } = req;
  const { userId } = req.params;
  const filter = {
    _id: userId,
  };
  const options = { new: true };
  const user = await userService.updateUser(filter, body, options);
  return res.status(httpStatus.OK).send({ results: user });
});

export const remove = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const filter = {
    _id: userId,
  };
  const user = await userService.removeUser(filter);
  return res.status(httpStatus.OK).send({ results: user });
});

export const createUser = catchAsync(async (req, res) => {
  const adminUserId = req.user._id;
  const { generalDetails, contactDetails, hobbies, address, eductionDetails, professionalDetails } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const options = {};

    // Create user
    const user = await userService.createUser(
      { ...generalDetails, ...contactDetails, hobbies, createdBy: adminUserId, updatedBy: adminUserId },
      options
    );

    const crateAddress = await addressService.createAddress({ ...address, createdBy: adminUserId, updatedBy: adminUserId });
    const createUserEducation = await educationservice.createEducation({
      ...eductionDetails,
      userId: user._id,
      createdBy: adminUserId,
      updatedBy: adminUserId,
    });
    const createProfessionalDetail = await userProfessionalDetailService.createUserProfessionalDetail({
      userId: user._id,
      ...professionalDetails,
      createdBy: adminUserId,
      updatedBy: adminUserId,
    });

    const password = generatePassword(8);

    // update user here
    const updateUser = await userService.updateUserForAuth(
      { _id: user._id },
      {
        password,
        address: crateAddress._id,
        userEducation: createUserEducation._id,
        userProfessional: createProfessionalDetail._id,
        createdBy: adminUserId,
        updatedBy: adminUserId,
      },
      {},
      user
    );
    const token = await tokenService.generateVerifyEmailToken(user.email);

    // Send verification email
    await emailService.sendEmailVerificationEmail(user, token, password);
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    return res.status(httpStatus.OK).send({ results: updateUser });
  } catch (e) {
    // If any operation fails, abort the transaction
    await session.abortTransaction();
    session.endSession();
    console.error('Transaction error:', e); // todo : add logger here
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'Something went wrong Create User Transaction error:', e });
  }
});

export const dashboard = catchAsync(async (req, res) => {
  const { appUsesType } = req.params;

  const { totalUsers, activeUsers, lastWeekRegisteredUsers, onlineUsers, totalMaleUsers, totalFemaleUsers } =
    await userService.getUserCounts(appUsesType);

  const totalRevenueGenerated = 100000;
  const totalDonationCollection = 10000;
  const goldPlan = 1200;
  const silverPlan = 2300;
  const PlatinumPlan = 2300;

  return res.status(httpStatus.OK).send({
    totalUsers,
    activeUsers,
    lastWeekRegisteredUsers,
    onlineUsers,
    totalMaleUsers,
    totalFemaleUsers,
    totalRevenueGenerated,
    totalDonationCollection,
    goldPlan,
    silverPlan,
    PlatinumPlan,
  });
});

export const updateUser = catchAsync(async (req, res) => {
  const adminUserId = req.user._id;
  const { userId } = req.params;
  const { generalDetails, contactDetails, hobbies, address, eductionDetails, professionalDetails } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const options = {};

    // Update core user info
    const updatedUser = await userService.updateUser(
      { _id: userId },
      {
        ...generalDetails,
        ...contactDetails,
        hobbies,
        updatedBy: adminUserId,
      },
      options
    );

    // Update or create address
    await addressService.updateAddress(
      { userId },
      {
        ...address,
        updatedBy: adminUserId,
      }
    );

    // Update or create education
    await educationservice.updateEducation(
      { userId },
      {
        ...eductionDetails,
        updatedBy: adminUserId,
      }
    );

    // Update or create professional details
    await userProfessionalDetailService.updateUserProfessionalDetail(
      { userId },
      {
        ...professionalDetails,
        updatedBy: adminUserId,
      }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(httpStatus.OK).send({ message: 'User updated successfully', results: updatedUser });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.error('Update transaction error:', e);
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'Update User Transaction error', details: e.message });
  }
});

/**
 * Reset credits for a specific user (Admin only)
 */
export const resetUserCredits = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { reason = 'Admin Reset' } = req.body;
  const adminId = req.user._id;

  // Validate if user exists
  const user = await userService.getOne({ _id: userId });
  if (!user) {
    return res.status(httpStatus.NOT_FOUND).send({ error: 'User not found' });
  }

  // Check current credit balance
  const currentBalance = await creditService.getUserCreditBalance(userId);
  if (currentBalance === 0) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: 'User already has zero credits',
      currentBalance: 0,
    });
  }

  // Reset credits using credit service
  try {
    await creditService.resetCredits({
      userId,
      reason: 'Admin Reset',
      notes: `Admin reset by ${adminId}. Reason: ${reason}. Previous balance: ${currentBalance}`,
    });

    return res.status(httpStatus.OK).send({
      message: 'User credits reset successfully',
      previousBalance: currentBalance,
      currentBalance: 0,
      resetBy: adminId,
      reason,
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to reset credits: ${error.message}`);
  }
});

/**
 * Reset credits for multiple users (Admin only)
 */
export const resetMultipleUserCredits = catchAsync(async (req, res) => {
  const { userIds, reason = 'Bulk Admin Reset' } = req.body;
  const adminId = req.user._id;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'userIds array is required' });
  }

  // Validate all users exist
  const users = await userService.getMany({ _id: { $in: userIds } });
  const foundUserIds = users.map((user) => user._id.toString());
  const missingUserIds = userIds.filter((id) => !foundUserIds.includes(id));

  if (missingUserIds.length > 0) {
    return res.status(httpStatus.BAD_REQUEST).send({
      error: 'Some users not found',
      missingUserIds,
    });
  }

  // Get users with credits to reset
  const resetResults = [];

  // Process all users in parallel
  const resetPromises = userIds.map(async (userId) => {
    try {
      const currentBalance = await creditService.getUserCreditBalance(userId);
      if (currentBalance > 0) {
        await creditService.resetCredits({
          userId,
          reason: 'Admin Reset',
          notes: `Bulk admin reset by ${adminId}. Reason: ${reason}. Previous balance: ${currentBalance}`,
        });
        return {
          userId,
          previousBalance: currentBalance,
          currentBalance: 0,
          success: true,
        };
      }
      return {
        userId,
        previousBalance: 0,
        currentBalance: 0,
        success: false,
        message: 'User already has zero credits',
      };
    } catch (error) {
      return {
        userId,
        success: false,
        error: error.message,
      };
    }
  });

  const results = await Promise.allSettled(resetPromises);

  // Collect results
  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.success) {
      resetResults.push(result.value);
    }
  });

  return res.status(httpStatus.OK).send({
    message: `Credits reset for ${resetResults.length} users`,
    resetResults,
    resetBy: adminId,
    reason,
  });
});
