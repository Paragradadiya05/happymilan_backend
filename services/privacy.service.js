import { Privacy } from 'models';

export async function createPrivacy(body = {}) {
  const privacy = await Privacy.create(body);
  return privacy;
}

export async function getPrivacy(filter, options = {}) {
  const privacy = await Privacy.find(filter, options.projection, options);
  return privacy;
}

export async function updatePrivacy(filter, body, options = {}) {
  const privacy = await Privacy.findOneAndUpdate(filter, body, options);
  return privacy;
}
