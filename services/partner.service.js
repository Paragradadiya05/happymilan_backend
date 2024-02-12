import { Partner } from '../models';

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
  const userPartnerDetail = await Partner.create(body);
  return userPartnerDetail;
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
