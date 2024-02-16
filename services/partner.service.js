import httpStatus from 'http-status';
import { Partner, User } from '../models';
import ApiError from '../utils/ApiError';

export async function getOne(query, options = {}) {
  const userPartnerDetail = await Partner.findOne(query, options.projection, options);
  return userPartnerDetail;
}

export async function getPartnerList(filter, options = {}) {
  const userPartnerDetail = await Partner.find(filter, options.projection, options);
  return userPartnerDetail;
}

export async function getPartnerListWithPagination(filter, options = {}) {
  const userPartnerDetail = await Partner.paginate(filter, options);
  return userPartnerDetail;
}

export async function createPartner(body = {}) {
  if (body.userId) {
    const userId = await User.findOne({ _id: body.userId });
    if (!userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field userId is not valid');
    }
  }
  const findPartner = await Partner.find({ userId: body.userId });
  let partner;
  if (findPartner.length) {
    partner = await Partner.findOneAndUpdate({ userId: body.userId }, body, {
      new: true,
    });
  } else {
    partner = await Partner.create(body);
  }
  return partner;
}

export async function updatePartner(filter, body, options = {}) {
  const userPartnerDetail = await Partner.findOneAndUpdate(filter, body, options);
  return userPartnerDetail;
}

export async function updateManyPartner(filter, body, options = {}) {
  const userPartnerDetail = await Partner.updateMany(filter, body, options);
  return userPartnerDetail;
}

export async function removePartner(filter) {
  const userPartnerDetail = await Partner.findOneAndRemove(filter);
  return userPartnerDetail;
}

export async function removeManyPartner(filter) {
  const userPartnerDetail = await Partner.deleteMany(filter);
  return userPartnerDetail;
}
