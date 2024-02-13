import { User, UserProfessionalDetail } from 'models';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';

export async function getUserProfessionalDetailById(id, options = {}) {
  const userProfessionalDetail = await UserProfessionalDetail.findById(id, options.projection, options);
  return userProfessionalDetail;
}

export async function getOne(query, options = {}) {
  const userProfessionalDetail = await UserProfessionalDetail.findOne(query, options.projection, options);
  return userProfessionalDetail;
}

export async function getUserProfessionalDetailList(filter, options = {}) {
  const userProfessionalDetail = await UserProfessionalDetail.find(filter, options.projection, options);
  return userProfessionalDetail;
}

export async function getUserProfessionalDetailListWithPagination(filter, options = {}) {
  const userProfessionalDetail = await UserProfessionalDetail.paginate(filter, options);
  return userProfessionalDetail;
}

export async function createUserProfessionalDetail(body = {}) {
  if (body.userId) {
    const userId = await User.findOne({ _id: body.userId });
    if (!userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field userId is not valid');
    }
  }
  const findProfessional = await UserProfessionalDetail.find({ userId: body.userId });
  let professional;
  if (findProfessional.length) {
    professional = await UserProfessionalDetail.findOneAndUpdate({ userId: body.userId }, body, {
      new: true,
    });
  } else {
    professional = await UserProfessionalDetail.create(body);
  }
  return professional;
}

export async function updateUserProfessionalDetail(filter, body, options = {}) {
  const userProfessionalDetail = await UserProfessionalDetail.findOneAndUpdate(filter, body, options);
  return userProfessionalDetail;
}

export async function updateManyUserProfessionalDetail(filter, body, options = {}) {
  const userProfessionalDetail = await UserProfessionalDetail.updateMany(filter, body, options);
  return userProfessionalDetail;
}

export async function removeUserProfessionalDetail(filter) {
  const userProfessionalDetail = await UserProfessionalDetail.findOneAndRemove(filter);
  return userProfessionalDetail;
}

export async function removeManyUserProfessionalDetail(filter) {
  const userProfessionalDetail = await UserProfessionalDetail.deleteMany(filter);
  return userProfessionalDetail;
}

export async function aggregateUserProfessionalDetail(query) {
  const userProfessionalDetail = await UserProfessionalDetail.aggregate(query);
  return userProfessionalDetail;
}

export async function aggregateUserProfessionalDetailWithPagination(query, options = {}) {
  const aggregate = UserProfessionalDetail.aggregate();
  // eslint-disable-next-line
  query.map((obj) => {
    aggregate._pipeline.push(obj);
  });
  const userProfessionalDetail = await UserProfessionalDetail.aggregatePaginate(aggregate, options);
  return userProfessionalDetail;
}
