// cronjobs/imageBlurCleanup.job.js
import cron from 'node-cron';
import { logger } from '../config/logger';

/**
 * Schedule a cron job to run at 4 AM every day to clean up blurred images
 * that are older than 24 hours
 */
// eslint-disable-next-line import/prefer-default-export
export const scheduleBlurredImageCleanup = () => {
  // Schedule task to run at 4 AM every day
  // Cron expression: '0 4 * * *' means:
  // - 0 minutes
  // - 4 hours (4 AM)
  // - Every day of month (*)
  // - Every month (*)
  // - Every day of week (*)
  cron.schedule(
    '0 4 * * *',
    async () => {
      try {
        logger.info('Starting scheduled cleanup of blurred images...');

        // Call the cleanup function from imageBlurService
        // const result = await imageBlurService.cleanupBlurredImages(24);

        // logger.info(`Blurred image cleanup completed: ${result.deleted} images removed`);
      } catch (error) {
        logger.error('Error during blurred image cleanup:', error);
      }
    },
    {
      timezone: 'Asia/Kolkata', // Set to Indian timezone
    }
  );

  logger.info('Blurred image cleanup job scheduled to run at 4 AM daily');
};
