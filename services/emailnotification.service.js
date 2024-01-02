import { EmailNotification } from '../models';

export async function createNotification(body = {}) {
  const notification = await EmailNotification.create(body);
  return notification;
}

export async function getNotification(filter, options = {}) {
  const notification = await EmailNotification.find(filter, options.projection, options);
  return notification;
}
