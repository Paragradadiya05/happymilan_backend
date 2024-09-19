import { Kyc } from 'models';

export async function getkycById(id, options = {}) {
  const kyc = await Kyc.findById(id, options.projection, options);
  return kyc;
}

export async function getOne(query, options = {}) {
  const kyc = await Kyc.findOne(query, options.projection, options);
  return kyc;
}

export async function getkycList(filter, options = {}) {
  const kyc = await Kyc.find(filter, options.projection, options);
  return kyc;
}

export async function getkycListWithPagination(filter, options = {}) {
  const kyc = await Kyc.paginate(filter, options);
  return kyc;
}

export async function createkyc(body = {}) {
  const kyc = await Kyc.create(body);
  return kyc;
}

export async function updatekyc(filter, body, options = {}) {
  const kyc = await Kyc.findOneAndUpdate(filter, body, options);
  return kyc;
}

export async function updateManykyc(filter, body, options = {}) {
  const kyc = await Kyc.updateMany(filter, body, options);
  return kyc;
}

export async function removekyc(filter) {
  const kyc = await Kyc.findOneAndRemove(filter);
  return kyc;
}

export async function removeManykyc(filter) {
  const kyc = await Kyc.deleteMany(filter);
  return kyc;
}
