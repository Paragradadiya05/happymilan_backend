import { Education } from '../models';

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
  const userEducationDetail = await Education.create(body);
  return userEducationDetail;
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
