import ApiError from 'utils/ApiError';
import httpStatus from 'http-status';
import { User } from 'models';
import _ from 'lodash';
import bcrypt from 'bcryptjs';
import { notificationService } from './index';

export async function getUserById(id, options = {}) {
  const user = await User.findById(id, options.projection, options);
  return user;
}
// todo:check populate in database
export async function getOne(query, options = {}) {
  console.log('===', query);
  const user = await User.findOne(query, options.projection, options)
    .populate('address')
    .populate('userPartner')
    .populate('userEducation')
    .populate('userProfessional')
    .exec();
  console.log('===', user);
  return user;
}

export async function getUserList(filter, options = {}) {
  console.log('=== filtere ===', filter);
  const user = await User.find(filter, options.projection, options)
    .populate('address')
    .populate('userEducation')
    .populate('UserPartner')
    .populate('userProfessional');
  return user;
}

export async function getUserListWithPagination(filter, options = {}) {
  const user = await User.paginate(filter, options);
  return user;
}

export async function createUser(body) {
  if (await User.isEmailTaken(body.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  const user = await User.create(body);
  return user;
}

export async function updateUser(filter, body, options = {}) {
  const userData = await getOne(filter, {});
  const { profilePic } = body.profilePic;

  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (body.email && (await User.isEmailTaken(body.email, userData.id))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  if (profilePic) {
    // Update userProfilePic array and set isProfilePic to true for the matching URL
    // eslint-disable-next-line no-param-reassign
    body.userProfilePic = body.userProfilePic.map((image) => ({
      ...image,
      isProfilePic: image.url === profilePic ? true : image.isProfilePic || false,
    }));
  }
  const user = await User.findOneAndUpdate(filter, body, options);
  return user;
}

export async function updateUserForAuth(filter, body, options = {}, user) {
  if (body.email && (await User.findOne({ email: body.email, _id: { $ne: user._id } }))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  if (body && body.password) {
    // eslint-disable-next-line no-param-reassign
    body.password = await bcrypt.hash(body.password, 10);
  }

  await User.updateOne(filter, body, options)
    .populate('address')
    .populate('userEducation')
    .populate('UserPartner')
    .populate('userProfessional');
  return getOne(filter);
}

export async function updateManyUser(filter, body, options = {}) {
  const user = await User.updateMany(filter, body, options);
  return user;
}

export async function removeUser(filter) {
  const user = await User.findOneAndRemove(filter);
  return user;
}

export async function removeManyUser(filter) {
  const user = await User.deleteMany(filter);
  return user;
}

export async function addDeviceToken(user, body) {
  const { deviceToken, platform } = body;
  const isFCMValid = notificationService.verifyFCMToken(deviceToken);
  if (!isFCMValid) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'The FCM Token is invalid!');
  }
  const deviceTokenList = user.deviceTokens.map((data) => data.deviceToken);
  if (_.indexOf(deviceTokenList, deviceToken) === -1) {
    user.deviceTokens.push({ deviceToken, platform });
    const updatedUser = await updateUser({ _id: user._id }, user);
    return updatedUser;
  }
}
