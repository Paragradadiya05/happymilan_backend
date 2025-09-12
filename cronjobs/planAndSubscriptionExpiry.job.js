import cron from 'node-cron';
import { Subscription, UserPlan } from 'models';
import { logger } from '../config/logger';

/**
 * Expire user plans when endDate is passed
 */
const expireUserPlans = async () => {
  try {
    logger.info('Starting user plan expiry process...');

    const now = new Date();

    // Find active plans with endDate < now
    const expiredPlans = await UserPlan.find({
      status: 'ACTIVE',
      endDate: { $lt: now },
    });

    if (expiredPlans.length === 0) {
      logger.info('No user plans to expire');
      return { processed: 0 };
    }

    // Update all expired plans
    const updateResult = await UserPlan.updateMany(
      { _id: { $in: expiredPlans.map((plan) => plan._id) } },
      { $set: { status: 'INACTIVE' } }
    );

    logger.info(`Expired ${expiredPlans.length} user plans -> Updated: ${updateResult.modifiedCount}`);
    return { processed: expiredPlans.length, updated: updateResult.modifiedCount };
  } catch (error) {
    logger.error('Error expiring user plans:', error);
    throw error;
  }
};

/**
 * Expire subscriptions when endDate is passed
 */
const expireSubscriptions = async () => {
  try {
    const now = new Date();
    logger.info('🚀 Starting subscription expiry process...');
    logger.info(`📅 Current time: ${now.toISOString()}`);

    // Find active subscriptions with endDate < now
    const expiredSubs = await Subscription.find({
      status: 'ACTIVE',
    });
    console.log('=====xx====>', expiredSubs);
    logger.info(`🔍 Query -> status: 'active', endDate < ${now.toISOString()}`);
    logger.info(`📊 Found ${expiredSubs.length} expired subscriptions`);

    if (expiredSubs.length === 0) {
      logger.info('✅ No subscriptions to expire');
      return { processed: 0 };
    }

    // Log first few expired subscription IDs for debug
    logger.info(
      `🆔 Expired subscription IDs: ${expiredSubs
        .slice(0, 5)
        .map((s) => s._id.toString())
        .join(', ')}${expiredSubs.length > 5 ? ' ...' : ''}`
    );

    // Update all expired subscriptions
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
