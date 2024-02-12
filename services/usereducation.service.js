import httpStatus from 'http-status';
import { Education, User } from '../models';
import ApiError from '../utils/ApiError';

export async function getOne(query, options = {}) {
  const userEducationDetail = await Education.findOne(query, options.projection, options);
  return userEducationDetail;
}

export async function getEducationList(filter, options = {}) {
  const userEducationDetail = await Education.find(filter, options.projection, options);
  return userEducationDetail;
}

export async function getEducationListWithPagination(filter, options = {}) {
  const userEducationDetail = await Education.paginate(filter, options);
  return userEducationDetail;
}

export async function createEducation(body = {}) {
  if (body.userId) {
    const userId = await User.findOne({ _id: body.userId });
    if (!userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field userId is not valid');
    }
  }
  const findEducation = await Education.find({ userId: body.userId });
  let education;
  if (findEducation.length) {
    education = await Education.findOneAndUpdate({ userId: body.userId }, body, {
      new: true,
    });
  } else {
    education = await Education.create(body);
  }
  return education;
}

export async function updateEducation(filter, body, options = {}) {
  const userEducationDetail = await Education.findOneAndUpdate(filter, body, options);
  return userEducationDetail;
}

export async function updateManyEducation(filter, body, options = {}) {
  const userEducationDetail = await Education.updateMany(filter, body, options);
  return userEducationDetail;
}

export async function removeEducation(filter) {
  const userEducationDetail = await Education.findOneAndRemove(filter);
  return userEducationDetail;
}

export async function removeManyEducation(filter) {
  const userEducationDetail = await Education.deleteMany(filter);
  return userEducationDetail;
}
