// cronjobs/index.js
import { scheduleBlurredImageCleanup } from './imageBlurCleanup.job';
import { logger } from '../config/logger';

/**
 * Initialize all cron jobs for the application
 */
export const initCronJobs = () => {
  // Initialize blurred image cleanup job
  scheduleBlurredImageCleanup();

  // Add other scheduled tasks here as needed

  logger.info('All cron jobs initialized');
};

export default {
  initCronJobs,
};
