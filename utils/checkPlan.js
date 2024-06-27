import { Subscription } from 'models';

async function checkSubscriptionStatus(subscriptionId) {
  try {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return { success: false, message: 'Subscription not found' };
    }

    const isActive = subscription.status === 'active';
    return { success: true, isActive };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

console.log('===== checkSubscriptionStatus ====>', checkSubscriptionStatus);
