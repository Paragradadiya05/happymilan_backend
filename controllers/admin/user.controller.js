import httpStatus from 'http-status';
import { addressService, educationservice, userProfessionalDetailService, userService } from 'services';
import { catchAsync } from 'utils/catchAsync';
import mongoose from 'mongoose';
import { pick } from '../../utils/pick';

export const get = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const filter = {
    _id: userId,
  };
  const options = {};
  const user = await userService.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: user });
});

export const list = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const user = await userService.getUserList(filter, options);
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

    // update user here
    const updateUser = await userService.updateUserForAuth(
      { _id: user._id },
      {
        address: crateAddress._id,
        userEducation: createUserEducation._id,
        userProfessional: createProfessionalDetail._id,
        createdBy: adminUserId,
        updatedBy: adminUserId,
      }
    );

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
