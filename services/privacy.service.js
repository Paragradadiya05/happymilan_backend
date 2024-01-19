import { Privacy } from 'models';
import ApiError from '../utils/ApiError';

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
  if (!privacy) {
    // Throw a custom "not found" error
    throw new ApiError('data not found chack id');
  }
  return privacy;
}
