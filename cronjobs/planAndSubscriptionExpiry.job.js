import cron from 'node-cron';
import { Subscription, UserPlan } from 'models';
import { logger } from '../config/logger';
import { subscriptionservice, userPlanService } from '../services';

/**
 * Expire user plans when endDate is passed
 */
const expireUserPlans = async () => {
  try {
    logger.info('🚀 Starting user plan expiry process...');

    // Filter: find active plans with endDate before now
    const filter = {
      status: 'active',
      endDate: { $lt: new Date() },
    };

    const expiredPlans = await userPlanService.getUserPlanList(filter);

    if (!expiredPlans || expiredPlans.length === 0) {
      logger.info('✅ No user plans to expire');
      return { processed: 0 };
    }

    // Update all expired plans
    const updateResult = await UserPlan.updateMany(
      { _id: { $in: expiredPlans.map((plan) => plan._id) } },
      { $set: { status: 'inactive' } }
    );

    logger.info(`⚡ Expired ${expiredPlans.length} user plans -> Updated: ${updateResult.modifiedCount}`);

    return { processed: expiredPlans.length, updated: updateResult.modifiedCount };
  } catch (error) {
    logger.error('❌ Error expiring user plans:', error);
    throw error;
  }
};

/**
 * Expire subscriptions when endDate is passed
 */
const expireSubscriptions = async () => {
  try {
    // filter: only active subscriptions with endDate < now
    const filter = {
      status: 'active',
      endDate: { $lt: new Date() },
    };

    const expiredSubs = await subscriptionservice.getSubscription(filter);
    if (!expiredSubs || expiredSubs.length === 0) {
      logger.info('✅ No subscriptions to expire');
      return { processed: 0 };
    }

    const updateResult = await Subscription.updateMany(
      { _id: { $in: expiredSubs.map((sub) => sub._id) } },
      { $set: { status: 'inactive' } }
    );

    logger.info(`⚡ Expired ${expiredSubs.length} subscriptions -> Updated: ${updateResult.modifiedCount}`);

    return { processed: expiredSubs.length, updated: updateResult.modifiedCount };
  } catch (error) {
    logger.error('❌ Error expiring subscriptions:', error);
    throw error;
  }
};

/**
 * Schedule cron jobs
 */
export const schedulePlanAndSubscriptionExpiryJob = () => {
  // Runs every day at 2:30 AM IST
  cron.schedule(
    '* * * * *',
    async () => {
      try {
        await expireUserPlans();
        await expireSubscriptions();
      } catch (error) {
        logger.error('Plan/Subscription expiry cron job failed:', error);
      }
    },
    {
      timezone: 'Asia/Kolkata',
    }
  );

  logger.info('Plan & Subscription expiry job scheduled for 2:30 AM daily');
};

// Export individual functions for manual run if needed
export { expireUserPlans, expireSubscriptions };

// Run every minute
