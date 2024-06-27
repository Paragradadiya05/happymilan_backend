import { Subscription } from 'models';

async function checkSubscriptionStatus(userId) {
  try {
    // Find the latest subscription for the user
    const latestSubscription = await Subscription.findOne({ user: userId })
      .sort({ createdAt: -1 }) // Sort by createdAt descending to get the latest first
      .exec();

    if (!latestSubscription) {
      return { success: false, message: 'No subscription found for the user' };
    }

    const isActive = latestSubscription.status === 'active';
    return { success: true, isActive };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

console.log('===== checkSubscriptionStatus ====>', checkSubscriptionStatus);
