import { Offer } from '../models';

export async function createOffer(body = {}, user) {
  const userId = user._id;
  const offer = await Offer.create({ user: userId, ...body });
  return offer;
}
export async function getOffer(filter, options = {}) {
  const offer = await Offer.find(filter, options.projection, options);
  return offer;
}
