import ApiError from 'utils/ApiError';
import httpStatus from 'http-status';
import { Friend, Users } from 'models';

export async function getFriendById(id, options = {}) {
  const friend = await Friend.findById(id, options.projection, options);
  return friend;
}

export async function getOne(query, options = {}) {
  const friend = await Friend.findOne(query, options.projection, options);
  return friend;
}

export async function getFriendList(filter, options = {}) {
  const friend = await Friend.find(filter, options.projection, options);
  return friend;
}

export async function getFriendListWithPagination(filter, options = {}) {
  const friend = await Friend.paginate(filter, options);
  return friend;
}

export async function createFriend(body = {}) {
  const initiatorUserArr = body.statusHistory.map((item) => item.initiatorUser);
  const initiatorUser = await Users.find({ _id: { $in: initiatorUserArr } });
  if (initiatorUser.length !== initiatorUserArr.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'initiatorUser of statusHistory some ids not valid');
  }
  return Friend.create(body);
}

export async function updateFriend(filter, body, options = {}) {
  const initiatorUserArr = body.statusHistory.map((item) => item.initiatorUser);
  const initiatorUser = await Users.find({ _id: { $in: initiatorUserArr } });
  if (initiatorUser.length !== initiatorUserArr.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'initiatorUser of statusHistory some ids not valid');
  }
  const friend = await Friend.findOneAndUpdate(filter, body, options);
  return friend;
}

export async function updateManyFriend(filter, body, options = {}) {
  const friend = await Friend.updateMany(filter, body, options);
  return friend;
}

export async function removeFriend(filter) {
  const friend = await Friend.findOneAndRemove(filter);
  return friend;
}

export async function removeManyFriend(filter) {
  const friend = await Friend.deleteMany(filter);
  return friend;
}

export async function aggregateFriend(query) {
  const friend = await Friend.aggregate(query);
  return friend;
}

export async function aggregateFriendWithPagination(query, options = {}) {
  const aggregate = Friend.aggregate();
  // eslint-disable-next-line
  query.map((obj) => {
    // eslint-disable-next-line
    aggregate._pipeline.push(obj);
  });
  const friend = await Friend.aggregatePaginate(aggregate, options);
  return friend;
}
