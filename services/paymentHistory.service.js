import { PaymentHistory } from 'models';

export async function getPaymentHistoryById(id, options = {}) {
  const paymentHistory = await PaymentHistory.findById(id, options.projection, options).populate('planId');
  return paymentHistory;
}

export async function getOne(query, options = {}) {
  const paymentHistory = await PaymentHistory.findOne(query, options.projection, options);
  return paymentHistory;
}

export async function getPaymentHistoryList(filter, options = {}) {
  const paymentHistory = await PaymentHistory.find(filter, options.projection, options).populate('planId');
  return paymentHistory;
}

export async function getPaymentHistoryListWithPagination(filter, options = {}) {
  const paymentHistory = await PaymentHistory.paginate(filter, options);
  return paymentHistory;
}

export async function createPaymentHistory(body = {}) {
  const paymentHistory = await PaymentHistory.create(body);
  return paymentHistory;
}

export async function updatePaymentHistory(filter, body, options = {}) {
  const paymentHistory = await PaymentHistory.findOneAndUpdate(filter, body, options);
  return paymentHistory;
}

export async function updateManyPaymentHistory(filter, body, options = {}) {
  const paymentHistory = await PaymentHistory.updateMany(filter, body, options);
  return paymentHistory;
}

export async function removePaymentHistory(filter) {
  const paymentHistory = await PaymentHistory.findOneAndRemove(filter);
  return paymentHistory;
}

export async function removeManyPaymentHistory(filter) {
  const paymentHistory = await PaymentHistory.deleteMany(filter);
  return paymentHistory;
}
