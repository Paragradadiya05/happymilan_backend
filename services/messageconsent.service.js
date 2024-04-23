import { MessageConsent, User } from 'models';

export async function createMessageConsent(body = {}) {
  const senderExists = await User.findOne({ _id: body.senderId });
  if (!senderExists) {
    throw new Error('Sender not found ');
  }
  const receiverExists = await User.findOne({ _id: body.receiverId });
  if (!receiverExists) {
    throw new Error('Receiver not found ');
  }
  const messageconsent = await MessageConsent.create(body);
  return messageconsent;
}

export async function updateMessageConsent(filter, body, options = {}) {
  const messageconsent = await MessageConsent.findOneAndUpdate(filter, body, options);
  return messageconsent;
}

export async function removeMessageConsent(filter) {
  const messageconsent = await MessageConsent.findOneAndRemove(filter);
  return messageconsent;
}

export async function getMessageConsentList(filter, options = {}) {
  const messageconsent = await MessageConsent.find(filter, options.projection, options);
  return messageconsent;
}
