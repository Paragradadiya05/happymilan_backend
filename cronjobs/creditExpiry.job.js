// cronjobs/creditExpiry.job.js
import cron from 'node-cron';
import { logger } from '../config/logger';
import { Credit, CreditHistory } from '../models';
import { userPlanService } from '../services';

/**
 * Check if user has any active plans
 * @param {string} userId - User ID to check
 * @returns {boolean} - True if user has active plans, false otherwise
 */
const hasActivePlan = async (userId) => {
  try {
    const activePlans = await userPlanService.getUserPlanList({
      userId,
      status: 'active',
    });
    return activePlans && activePlans.length > 0;
  } catch (error) {
    logger.error(`Error checking active plans for user ${userId}:`, error);
    return false;
  }
};

/**
 * Reset credits for users with expired plans
 */
const resetCreditsForExpiredPlans = async () => {
  try {
    logger.info('Starting credit reset process for users with expired plans...');

    // Find all users who have credit balances > 0
    const usersWithCredits = await Credit.find({
      creditBalance: { $gt: 0 },
      isDeleted: { $ne: true },
    });

    let resetUsers = 0;
    const processedUsers = usersWithCredits.length;

    // Process all users in parallel

    const results = await Promise.allSettled(
      usersWithCredits.map(async (userCredit) => {
        try {
          // Check if user has any active plans
          const userHasActivePlan = await hasActivePlan(userCredit.userId);

          if (!userHasActivePlan) {
            // User has no active plans, reset their credits
            const previousBalance = userCredit.creditBalance;

            // Create history entry for the debit
            await CreditHistory.create({
              creditId: userCredit._id,
              userId: userCredit.userId,
              transactionType: 'debit',
              amount: previousBalance,
              reason: 'Plan Expired',
              balanceAfterTransaction: 0,
              notes: `Credits reset due to plan expiry. Previous balance: ${previousBalance}`,
            });

            // Reset credit balance to 0
            await Credit.findByIdAndUpdate(userCredit._id, { creditBalance: 0 });

            logger.info(`Credits reset for user ${userCredit.userId}: ${previousBalance} -> 0`);
            return { userId: userCredit.userId, reset: true, previousBalance };
          }
          return { userId: userCredit.userId, reset: false };
        } catch (userError) {
          logger.error(`Error processing credits for user ${userCredit.userId}:`, userError);
          throw userError;
        }
      })
    );

    // Count successful resets
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.reset) {
        resetUsers += 1;
      }
    });

    logger.info(`Credit expiry job completed: Processed ${processedUsers} users, Reset ${resetUsers} users`);
    return { processedUsers, resetUsers };
  } catch (error) {
    logger.error('Error during credit expiry job:', error);
    throw error;
  }
};

/**
 * Schedule a cron job to run daily at 2 AM to reset credits for users with expired plans
 */
// eslint-disable-next-line import/prefer-default-export
export const scheduleCreditExpiryJob = () => {
  // Schedule task to run at 2 AM every day
  // Cron expression: '0 2 * * *' means:
  // - 0 minutes
  // - 2 hours (2 AM)
  // - Every day of month (*)
  // - Every month (*)
  // - Every day of week (*)
  cron.schedule(
    '0 2 * * *',
    async () => {
      try {
        await resetCreditsForExpiredPlans();
      } catch (error) {
        logger.error('Credit expiry cron job failed:', error);
      }
    },
    {
      timezone: 'Asia/Kolkata', // Set to Indian timezone
    }
  );

  logger.info('Credit expiry job scheduled to run at 2 AM daily');
};

// Export the function for manual execution if needed
export { resetCreditsForExpiredPlans };
