import { SpamUser, User } from 'models';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';

export async function createSpam(body = {}) {
  const spamUser = await User.findById(body.spamUserId);
  if (!spamUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No such user exists');
  }
  const spam = await SpamUser.create(body);
  return spam;
}

export async function updateSpam(filter, body, options = {}) {
  const spam = await SpamUser.findOneAndUpdate(filter, body, options);
  return spam;
}

export async function removeSpam(filter) {
  const spam = await SpamUser.findOneAndRemove(filter);
  return spam;
}

export async function getSpamList(filter, options = {}) {
  const spam = await SpamUser.find(filter, options.projection, options);
  return spam;
}
