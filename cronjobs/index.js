// cronjobs/index.js
import { scheduleBlurredImageCleanup } from './imageBlurCleanup.job';
import { scheduleRedisCacheSync } from './redisCacheSync.job'; // Import the new job
import { scheduleCreditExpiryJob } from './creditExpiry.job';
import { schedulePlanAndSubscriptionExpiryJob } from './planAndSubscriptionExpiry.job';
import { logger } from '../config/logger';

/**
 * Initialize all cron jobs for the application
 */
export const initCronJobs = () => {
  // Initialize blurred image cleanup job
  scheduleBlurredImageCleanup();
  scheduleRedisCacheSync(); // Initialize the new job
  scheduleCreditExpiryJob(); // Initialize credit expiry job
  schedulePlanAndSubscriptionExpiryJob();
  // Add other scheduled tasks here as needed

  logger.info('All cron jobs initialized');
};

export default {
  initCronJobs,
};
