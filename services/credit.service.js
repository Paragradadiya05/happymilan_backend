import { Credit, CreditHistory } from '../models';
import ApiError from '../utils/ApiError';

/**
 * Credit Service - Handles all credit operations with proper validation and history tracking
 */

/**
 * Get user's current credit balance
 * @param {string} userId - User ID
 * @returns {number} Current credit balance
 */
export const getUserCreditBalance = async (userId) => {
  const credit = await Credit.findOne({ userId });
  return credit;
};

/**
 * Check if user has sufficient credits
 * @param {string} userId - User ID
 * @param {number} requiredAmount - Required credit amount
 * @returns {boolean} True if user has sufficient credits
 */
export const hasSufficientCredits = async (userId, requiredAmount) => {
  const balance = await getUserCreditBalance(userId);
  return balance >= requiredAmount;
};

/**
 * Add credits to user account with history tracking
 * @param {Object} params - Credit addition parameters
 * @param {string} params.userId - User ID
 * @param {number} params.amount - Amount to add
 * @param {string} params.reason - Reason for credit addition
 * @param {string} [params.planId] - Optional plan ID reference
 * @param {string} [params.notes] - Optional notes
 * @returns {Object} Updated credit record
 */
export const addCredits = async ({ userId, amount, reason, planId = null, notes = '' }) => {
  if (amount <= 0) {
    throw new ApiError(400, 'Credit amount must be positive');
  }

  // Find or create credit record
  let userCredit = await Credit.findOne({ userId });
  if (!userCredit) {
    userCredit = await Credit.create({ userId, creditBalance: 0 });
  }

  // Update balance atomically
  const updatedCredit = await Credit.findByIdAndUpdate(userCredit._id, { $inc: { creditBalance: amount } }, { new: true });

  // Create history entry
  await CreditHistory.create({
    creditId: updatedCredit._id,
    userId,
    transactionType: 'credit',
    amount,
    reason,
    planId,
    balanceAfterTransaction: updatedCredit.creditBalance,
    notes: notes || `Added ${amount} credits - ${reason}`,
  });

  return updatedCredit;
};

/**
 * Deduct credits from user account with validation and history tracking
 * @param {Object} params - Credit deduction parameters
 * @param {string} params.userId - User ID
 * @param {number} params.amount - Amount to deduct
 * @param {string} params.reason - Reason for credit deduction
 * @param {string} [params.planId] - Optional plan ID reference
 * @param {string} [params.notes] - Optional notes
 * @returns {Object} Updated credit record
 */
export const deductCredits = async ({ userId, amount, reason, planId = null, notes = '' }) => {
  if (amount <= 0) {
    throw new ApiError(400, 'Deduction amount must be positive');
  }

  // Check if user has sufficient credits
  const hasEnoughCredits = await hasSufficientCredits(userId, amount);
  if (!hasEnoughCredits) {
    throw new ApiError(400, `Insufficient credits. Required: ${amount}`);
  }

  // Atomic deduction with validation
  const updatedCredit = await Credit.findOneAndUpdate(
    {
      userId,
      creditBalance: { $gte: amount }, // Ensure balance is still sufficient
    },
    {
      $inc: { creditBalance: -amount },
    },
    {
      new: true,
    }
  );

  // If atomic update failed, insufficient credits
  if (!updatedCredit) {
    throw new ApiError(400, 'Insufficient credits. Balance may have changed');
  }

  // Create history entry
  await CreditHistory.create({
    creditId: updatedCredit._id,
    userId,
    transactionType: 'debit',
    amount,
    reason,
    planId,
    balanceAfterTransaction: updatedCredit.creditBalance,
    notes: notes || `Deducted ${amount} credits - ${reason}`,
  });

  return updatedCredit;
};

/**
 * Reset user credits to zero with history tracking
 * @param {Object} params - Credit reset parameters
 * @param {string} params.userId - User ID
 * @param {string} params.reason - Reason for reset
 * @param {string} [params.planId] - Optional plan ID reference
 * @param {string} [params.notes] - Optional notes
 * @returns {Object} Updated credit record
 */
export const resetCredits = async ({ userId, reason, planId = null, notes = '' }) => {
  const userCredit = await Credit.findOne({ userId });
  if (!userCredit || userCredit.creditBalance === 0) {
    return userCredit || { creditBalance: 0 };
  }

  const previousBalance = userCredit.creditBalance;

  // Reset to zero
  const updatedCredit = await Credit.findByIdAndUpdate(userCredit._id, { creditBalance: 0 }, { new: true });

  // Create history entry for the reset
  await CreditHistory.create({
    creditId: updatedCredit._id,
    userId,
    transactionType: 'debit',
    amount: previousBalance,
    reason,
    planId,
    balanceAfterTransaction: 0,
    notes: notes || `Reset ${previousBalance} credits - ${reason}`,
  });

  return updatedCredit;
};

/**
 * Validate credit balance consistency with history
 * @param {string} userId - User ID
 * @returns {Object} Validation result with balance info
 */
export const validateCreditConsistency = async (userId) => {
  const userCredit = await Credit.findOne({ userId });
  const currentBalance = userCredit ? userCredit.creditBalance : 0;

  // Calculate balance from history
  const historyResult = await CreditHistory.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        totalCredits: {
          $sum: {
            $cond: [{ $eq: ['$transactionType', 'credit'] }, '$amount', 0],
          },
        },
        totalDebits: {
          $sum: {
            $cond: [{ $eq: ['$transactionType', 'debit'] }, '$amount', 0],
          },
        },
      },
    },
  ]);

  const { totalCredits = 0, totalDebits = 0 } = historyResult[0] || {};
  const calculatedBalance = totalCredits - totalDebits;
  const isConsistent = currentBalance === calculatedBalance;

  return {
    currentBalance,
    calculatedBalance,
    totalCredits,
    totalDebits,
    isConsistent,
    difference: currentBalance - calculatedBalance,
  };
};

export default {
  getUserCreditBalance,
  hasSufficientCredits,
  addCredits,
  deductCredits,
  resetCredits,
  validateCreditConsistency,
};
