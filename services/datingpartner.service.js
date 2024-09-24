import httpStatus from 'http-status';
import { Datingpartner, User } from '../models';
import ApiError from '../utils/ApiError';

export async function getOne(query, options = {}) {
  const userPartnerDetail = await Datingpartner.findOne(query, options.projection, options);
  return userPartnerDetail;
}

export async function getPartnerList(filter, options = {}) {
  const userPartnerDetail = await Datingpartner.find(filter, options.projection, options);
  return userPartnerDetail;
}

export async function getPartnerListWithPagination(filter, options = {}) {
  const userPartnerDetail = await Datingpartner.paginate(filter, options);
  return userPartnerDetail;
}

export async function createPartner(body = {}) {
  if (body.userId) {
    const userId = await User.findOne({ _id: body.userId });
    if (!userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field userId is not valid');
    }
  }
  const findPartner = await Datingpartner.find({ userId: body.userId });
  let partner;
  if (findPartner.length) {
    partner = await Datingpartner.findOneAndUpdate({ userId: body.userId }, body, {
      new: true,
    });
  } else {
    partner = await Datingpartner.create(body);
  }
  return partner;
}

export async function updatePartner(filter, body, options = {}) {
  const userPartnerDetail = await Datingpartner.findOneAndUpdate(filter, body, options);
  return userPartnerDetail;
}

export async function updateManyPartner(filter, body, options = {}) {
  const userPartnerDetail = await Datingpartner.updateMany(filter, body, options);
  return userPartnerDetail;
}

export async function removePartner(filter) {
  const userPartnerDetail = await Datingpartner.findOneAndRemove(filter);
  return userPartnerDetail;
}

export async function removeManyPartner(filter) {
  const userPartnerDetail = await Datingpartner.deleteMany(filter);
  return userPartnerDetail;
}
