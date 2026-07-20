import { ClaimRequest } from '../models';

export async function createClaimRequest(body = {}) {
  const claim = await ClaimRequest.create(body);
  return claim;
}

export async function getClaimRequestById(id, options = {}) {
  const claim = await ClaimRequest.findById(id, options.projection, options);
  return claim;
}

export async function getOne(query, options = {}) {
  const claim = await ClaimRequest.findOne(query, options.projection, options);
  return claim;
}

export async function getClaimRequests(filter, options = {}) {
  const claims = await ClaimRequest.find(filter, options.projection, options).sort(options.sort || { createdAt: -1 });
  return claims;
}

export async function getClaimRequestsWithPagination(filter, options = {}) {
  const claims = await ClaimRequest.paginate(filter, options);
  return claims;
}

export async function updateClaimRequest(filter, body, options = {}) {
  const claim = await ClaimRequest.findOneAndUpdate(filter, body, { new: true, ...options });
  return claim;
}

export async function removeClaimRequest(filter) {
  const claim = await ClaimRequest.findOneAndRemove(filter);
  return claim;
}
