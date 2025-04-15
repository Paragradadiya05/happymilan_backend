// cronjobs/redisCacheSync.job.js
import cron from 'node-cron';
import { syncRedisCacheWithS3 } from '../services/imageblur.service';
import { logger } from '../config/logger';

// Schedule to run once daily at 3:00 AM
const CRON_SCHEDULE = '0 3 * * *'; // Adjust as needed (Minute Hour DayOfMonth Month DayOfWeek)
// const CRON_SCHEDULE = '*/1 * * * *'; // Adjust as needed (Every 5 minutes)

/**
 * Schedules the Redis cache sync with S3 job.
 */
export const scheduleRedisCacheSync = () => {
  if (cron.validate(CRON_SCHEDULE)) {
    logger.info(`Scheduling Redis cache sync job with schedule: ${CRON_SCHEDULE}`);
    cron.schedule(CRON_SCHEDULE, async () => {
      logger.info('Running scheduled Redis cache sync with S3...');
      try {
        const result = await syncRedisCacheWithS3();
        logger.info(
          `Redis cache sync finished. Scanned: ${result.scannedCount}, Deleted: ${result.deletedCount}, Errors: ${result.errorCount}`
        );
      } catch (error) {
        logger.error('Error during scheduled Redis cache sync:', error);
      }
    });
  } else {
    logger.error(`Invalid cron schedule pattern for Redis cache sync: ${CRON_SCHEDULE}`);
  }
};

export default {
  scheduleRedisCacheSync,
};
