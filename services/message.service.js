import { Message } from 'models';

export async function createMessage(body = {}) {
  const message = await Message.create(body);
  return message;
}

export async function getMessageList(filter, options = {}) {
  const message = await Message.find(filter, options.projection, options);
  return message;
}
