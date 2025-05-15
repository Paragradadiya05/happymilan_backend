import { Subscription } from 'models';

export async function createSubscription(body = {}) {
  const subscription = await Subscription.create(body);
  return subscription;
}

export async function getSubscription(filter, options = {}) {
  const subscription = await Subscription.find(filter, options.projection, options);
  return subscription;
}
export async function updateSubscription(filter, body, options = {}) {
  console.log('=====body', body);
  console.log('=====filter', filter);
  console.log('=====options', options);

  const subscription = await Subscription.findOneAndUpdate(filter, body, options);
  return subscription;
}

export async function getOne(query, options = {}) {
  const subscription = await Subscription.findOne(query, options.projection, options);
  return subscription;
}
