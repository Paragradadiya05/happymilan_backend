import httpStatus from 'http-status';
import {
  addressService,
  educationservice,
  emailService,
  tokenService,
  userProfessionalDetailService,
  userService,
} from 'services';
import { catchAsync } from 'utils/catchAsync';
import mongoose from 'mongoose';
import { pick } from '../../utils/pick';
import { generatePassword } from '../../utils/passwordGenerator';

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
        userProfileCompleted: true,
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
