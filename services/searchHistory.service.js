import { SearchHistory } from '../models';

export async function createHistory(body = {}) {
  const searchtHistory = await SearchHistory.create(body);
  return searchtHistory;
}
export async function getHistory(filter, options = {}) {
  const searchtHistory = await SearchHistory.find(filter, options.projection, options);
  return searchtHistory;
}
