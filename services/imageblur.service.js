// services/imageblur.service.js
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import os from 'os';
import axios from 'axios';
import AWS from 'aws-sdk';
import { TempS3 } from '../models'; // Adjusted path assuming models is one level up
import config from '../config/config'; // Adjusted path
import * as s3Service from './s3.service';

const { redisClient } = require('../config/redis'); // Use require for CommonJS module
// Initialize S3 client
const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  signatureVersion: 'v4',
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: process.env.AWS_BUCKET_REGION,
});

// Redis cache settings
const REDIS_CACHE_PREFIX = 'blurcache:';
const REDIS_CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours (adjust as needed)

/**
 * Downloads an image from a URL
 * @param {string} imageUrl - The URL of the image to download
 * @returns {Promise<Buffer>} - The image data as a buffer
 */
const downloadImage = async (imageUrl) => {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      responseEncoding: 'binary',
    });
    return Buffer.from(response.data, 'binary');
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
};

/**
 * Generates a consistent key for the blurred version of an image
 * @param {string} originalUrl - Original image URL
 * @returns {string} - Consistent key for the blurred version
 */
const getBlurredImageKey = (originalUrl) => {
  // Extract filename from URL
  const urlParts = originalUrl.split('/');
  const filename = urlParts[urlParts.length - 1];
  const fileNameParts = filename.split('.');
  const fileExtension = fileNameParts.pop();
  const fileName = fileNameParts.join('.');

  // Create a deterministic path for the blurred image based on original URL
  // We use a hash of the original path to ensure uniqueness and consistency
  const originalPath = urlParts.slice(0, -1).join('/');
  const pathHash = Buffer.from(originalPath).toString('base64').substring(0, 8);

  return `blurred_images/${pathHash}/${fileName}_blurred.${fileExtension}`;
};

/**
 * Check if a blurred version of the image already exists in S3
 * @param {string} key - S3 key to check
 * @returns {Promise<{exists: boolean, url?: string}>} - Whether the blurred image exists and its URL if it does.
 */
const checkIfBlurredImageExists = async (key) => {
  const s3Params = {
    Bucket: config.aws.bucket,
    Key: key,
  };

  try {
    // First check the database for this key
    const existingRecord = await TempS3.findOne({ key, isBlurred: true });

    if (existingRecord) {
      // If DB record exists, verify S3 object also exists
      try {
        await s3.headObject(s3Params).promise();
        // S3 object exists, return the stored URL
        return { exists: true, url: existingRecord.url };
      } catch (s3Err) {
        if (s3Err.code === 'NotFound') {
          // S3 object is missing, DB record is stale. Delete it.
          console.warn(`Stale TempS3 record found (key: ${key}). S3 object missing. Deleting record.`);
          await TempS3.deleteOne({ _id: existingRecord._id });
          return { exists: false };
        }
        // Different S3 error, re-throw
        console.error(`S3 error checking existing record (key: ${key}):`, s3Err);
        throw s3Err;
      }
    } else {
      // No DB record, check S3 directly
      try {
        await s3.headObject(s3Params).promise();
        // S3 object exists, but no DB record. Create one.
        const url = `https://${config.aws.bucket}.s3.amazonaws.com/${key}`;
        console.warn(`S3 object found (key: ${key}) but missing TempS3 record. Creating record.`);
        await TempS3.create({
          url,
          key,
          createdAt: new Date(), // Use current time as creation time is unknown
          isBlurred: true,
        });
        return { exists: true, url };
      } catch (s3Err) {
        if (s3Err.code === 'NotFound') {
          // S3 object doesn't exist, and no DB record. Correct state.
          return { exists: false };
        }
        // Different S3 error, re-throw
        console.error(`S3 error checking new key (${key}):`, s3Err);
        throw s3Err;
      }
    }
  } catch (error) {
    console.error(`Error in checkIfBlurredImageExists (key: ${key}):`, error);
    // Return false on general errors to prevent potential issues downstream
    return { exists: false };
  }
};

/**
 * Creates a blurred version of an image
 * @param {string} originalUrl - Original image URL
 * @param {number} blurAmount - Blur intensity (1-100)
 * @returns {Promise<string>} - URL of the blurred image
 */
export const blurImage = async (originalUrl, blurAmount = 25) => {
  // Check Redis cache first
  const redisKey = REDIS_CACHE_PREFIX + originalUrl;
  try {
    const cachedUrl = await redisClient.get(redisKey);
    if (cachedUrl) {
      // console.log(`Cache hit for: ${originalUrl}`);
      return cachedUrl;
    }
    // console.log(`Cache miss for: ${originalUrl}`);
  } catch (redisError) {
    console.error(`Redis GET error for key ${redisKey}:`, redisError);
    // Proceed without cache if Redis fails
  }

  let outputPath = null;

  try {
    // Generate a consistent key for the blurred version
    const blurredKey = getBlurredImageKey(originalUrl);

    // Check if a blurred version already exists in S3
    const existingBlurredImage = await checkIfBlurredImageExists(blurredKey);
    if (existingBlurredImage.exists) {
      // Update Redis cache and return existing URL
      try {
        await redisClient.set(redisKey, existingBlurredImage.url, 'EX', REDIS_CACHE_TTL_SECONDS);
      } catch (redisError) {
        console.error(`Redis SET error for key ${redisKey} (existing image):`, redisError);
        // Continue even if cache set fails
      }
      return existingBlurredImage.url;
    }

    // Create temp directory if it doesn't exist
    const tempDir = path.join(os.tmpdir(), 'happymilan_blurred_images');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Generate filename for the blurred image based on the key
    const keyParts = blurredKey.split('/');
    const blurredFileName = keyParts[keyParts.length - 1];
    outputPath = path.join(tempDir, blurredFileName);

    // Download the original image
    const imageBuffer = await downloadImage(originalUrl);

    // Apply blur effect using Sharp
    await sharp(imageBuffer).blur(blurAmount).toFile(outputPath);

    // Upload the blurred image to S3
    const uploadResult = await s3Service.uploadFileToS3bucket({
      filepath: outputPath,
      uploadpath: blurredKey,
      ContentType: `image/${outputPath.split('.').pop()}`,
      ContentLength: fs.statSync(outputPath).size.toString(),
    });

    // Store the temporary blurred image reference in database for cleanup
    const tempS3Body = {
      url: uploadResult,
      key: blurredKey,
      createdAt: new Date(),
      isBlurred: true,
    };

    await TempS3.create(tempS3Body);

    // Cleanup temporary file safely
    if (outputPath && fs.existsSync(outputPath)) {
      try {
        fs.unlinkSync(outputPath);
      } catch (unlinkError) {
        console.error('Error removing temporary file:', unlinkError);
        // Non-critical error, continue execution
      }
    }

    // Cache the result in Redis
    try {
      await redisClient.set(redisKey, uploadResult, 'EX', REDIS_CACHE_TTL_SECONDS);
    } catch (redisError) {
      console.error(`Redis SET error for key ${redisKey} (new image):`, redisError);
      // Continue even if cache set fails
    }

    return uploadResult;
  } catch (error) {
    console.error('Error blurring image:', error);

    // Cleanup temp file if it exists despite the error
    if (outputPath && fs.existsSync(outputPath)) {
      try {
        fs.unlinkSync(outputPath);
      } catch (unlinkError) {
        // Ignore errors during cleanup after another error
      }
    }

    // Return original image if blurring fails
    return originalUrl;
  }
};

/**
 * Cleanup old blurred images (to be run as a cron job), verifying S3 existence before deletion.
 * Uses Promise.allSettled for concurrent S3 checks.
 * @param {number} maxAgeHours - Maximum age in hours before deleting temporary blurred images
 */
export const cleanupBlurredImages = async (maxAgeHours = 24) => {
  let deletedDbCount = 0;
  let deletedS3Count = 0;
  let inconsistentCount = 0;
  let errorCount = 0;

  try {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() - maxAgeHours);

    // Find potentially expired records
    const expiredRecords = await TempS3.find({
      isBlurred: true,
      createdAt: { $lt: expirationDate },
    }).lean();

    if (expiredRecords.length === 0) {
      console.log('Blurred image cleanup: No expired records found.');
      return { deletedDbCount, deletedS3Count, inconsistentCount, errorCount };
    }

    console.log(`Blurred image cleanup: Found ${expiredRecords.length} potentially expired records. Checking S3 status...`);

    // Concurrently check S3 status for each record
    const checkPromises = expiredRecords.map(async (record) => {
      if (!record.key) {
        console.warn(`Blurred image cleanup: Record ${record._id} has no key, marking for DB deletion.`);
        return { status: 'stale_db', record }; // Mark as stale DB record
      }

      const s3Params = { Bucket: config.aws.bucket, Key: record.key };
      try {
        await s3.headObject(s3Params).promise();
        return { status: 'exists_s3', record }; // S3 object exists
      } catch (s3Err) {
        if (s3Err.code === 'NotFound') {
          console.warn(
            `Blurred image cleanup: S3 object not found for key ${record.key} (record ${record._id}). Marking for DB deletion.`
          );
          return { status: 'stale_db', record }; // S3 object missing, mark as stale DB record
        }
        // Other S3 error
        console.error(`Blurred image cleanup: S3 error checking key ${record.key} (record ${record._id}):`, s3Err);
        return { status: 'error_s3', record, error: s3Err }; // Mark as S3 error
      }
    });

    const results = await Promise.allSettled(checkPromises);

    // Process results
    const s3KeysToDelete = [];
    const dbIdsToDelete = [];
    // No need to explicitly clear Redis cache here, TTL handles expiration.
    // const urlsToClearFromCache = []; // Removed

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { status, record } = result.value;
        // if (record.url) urlsToClearFromCache.push(record.url); // Removed

        if (status === 'exists_s3') {
          s3KeysToDelete.push({ Key: record.key });
          dbIdsToDelete.push(record._id);
        } else if (status === 'stale_db') {
          dbIdsToDelete.push(record._id);
          inconsistentCount += 1;
        } else if (status === 'error_s3') {
          // Decide if DB record should be deleted even on S3 check error
          // dbIdsToDelete.push(record._id); // Optional: delete DB record despite S3 error
          errorCount += 1;
        }
      } else {
        // Promise itself rejected (unexpected error in the mapping function)
        console.error('Blurred image cleanup: Unexpected error during S3 check processing:', result.reason);
        errorCount += 1;
      }
    });

    // Delete from S3 (if any exist)
    if (s3KeysToDelete.length > 0) {
      console.log(`Blurred image cleanup: Attempting to delete ${s3KeysToDelete.length} objects from S3...`);
      try {
        // Assuming deleteObjects handles potential partial failures gracefully
        // and doesn't throw an error for the whole batch if one fails.
        // If it throws, wrap this in its own try/catch.
        await s3Service.deleteObjects(s3KeysToDelete);
        deletedS3Count = s3KeysToDelete.length; // Assuming success for count
        console.log(`Blurred image cleanup: S3 deletion request sent for ${deletedS3Count} objects.`);
      } catch (s3DeleteError) {
        console.error('Blurred image cleanup: Error during bulk S3 delete operation:', s3DeleteError);
        // Reset count or handle partial success if possible/needed
        deletedS3Count = 0; // Assume failure on error
        errorCount += s3KeysToDelete.length; // Count these as errors
      }
    }

    // Delete from database (if any marked)
    if (dbIdsToDelete.length > 0) {
      console.log(`Blurred image cleanup: Deleting ${dbIdsToDelete.length} records from DB...`);
      try {
        const deleteResult = await TempS3.deleteMany({ _id: { $in: dbIdsToDelete } });
        deletedDbCount = deleteResult.deletedCount || 0;
        console.log(`Blurred image cleanup: DB deletion complete (${deletedDbCount} records).`);
      } catch (dbDeleteError) {
        console.error('Blurred image cleanup: Error during bulk DB delete operation:', dbDeleteError);
        deletedDbCount = 0; // Assume failure on error
        errorCount += dbIdsToDelete.length; // Count these as errors
      }
    }

    // Cache clearing is handled by Redis TTL, no action needed here.

    console.log(
      `Blurred image cleanup finished. DB Records Deleted: ${deletedDbCount}, S3 Objects Deleted: ${deletedS3Count}, Inconsistencies Fixed: ${inconsistentCount}, Errors Encountered: ${errorCount}`
    );
    return { deletedDbCount, deletedS3Count, inconsistentCount, errorCount };
  } catch (error) {
    console.error('FATAL Error during blurred image cleanup:', error);
    // Return counts accumulated so far, plus the fatal error
    return { deletedDbCount, deletedS3Count, inconsistentCount, errorCount, error: error.message };
  }
};

/**
 * Deletes a specific blurred image record and its corresponding S3 object,
 * identified by the original image URL. Also clears the cache entry.
 * @param {string} originalUrl - The URL of the original image whose blurred version should be deleted.
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const deleteBlurredImageForOriginal = async (originalUrl) => {
  if (!originalUrl) {
    console.warn('deleteBlurredImageForOriginal called with no originalUrl.');
    return { success: false, message: 'Original URL is required.' };
  }

  try {
    const blurredKey = getBlurredImageKey(originalUrl);

    // Find the DB record first
    const record = await TempS3.findOne({ key: blurredKey, isBlurred: true }).lean();

    if (!record) {
      console.log(`deleteBlurredImageForOriginal: No TempS3 record found for key ${blurredKey}. Assuming already deleted.`);
      // Clear Redis cache entry
      const redisKey = REDIS_CACHE_PREFIX + originalUrl;
      try {
        await redisClient.del(redisKey);
        // console.log(`Cleared Redis cache for key: ${redisKey}`);
      } catch (redisError) {
        console.error(`Redis DEL error for key ${redisKey}:`, redisError);
        // Continue even if cache deletion fails
      }
      return { success: true, message: 'Record not found, assumed deleted.' };
    }

    // Attempt to delete S3 object
    try {
      await s3Service.deleteObjects([{ Key: blurredKey }]);
      console.log(`deleteBlurredImageForOriginal: Deleted S3 object with key ${blurredKey}.`);
    } catch (s3Err) {
      if (s3Err.code === 'NotFound' || (s3Err.Errors && s3Err.Errors[0] && s3Err.Errors[0].Code === 'NoSuchKey')) {
        // If S3 object doesn't exist, that's okay, proceed to delete DB record
        console.warn(
          `deleteBlurredImageForOriginal: S3 object not found for key ${blurredKey}, proceeding with DB deletion.`
        );
      } else {
        // Log other S3 errors but still attempt DB deletion
        console.error(`deleteBlurredImageForOriginal: Error deleting S3 object key ${blurredKey}:`, s3Err);
      }
    }

    // Delete DB record
    await TempS3.deleteOne({ _id: record._id });
    console.log(`deleteBlurredImageForOriginal: Deleted TempS3 record ${record._id} for key ${blurredKey}.`);

    // Clear Redis cache entry
    const redisKey = REDIS_CACHE_PREFIX + originalUrl;
    try {
      await redisClient.del(redisKey);
      // console.log(`Cleared Redis cache for key: ${redisKey}`);
    } catch (redisError) {
      console.error(`Redis DEL error for key ${redisKey}:`, redisError);
      // Continue even if cache deletion fails
    }

    return { success: true };
  } catch (error) {
    console.error(`Error in deleteBlurredImageForOriginal for URL ${originalUrl}:`, error);
    return { success: false, message: error.message };
  }
};

/**
 * Scans Redis cache for blurred image entries and verifies corresponding S3 object existence.
 * Deletes Redis keys for entries where the S3 object is missing.
 * Uses SCAN for safe iteration over potentially large key sets.
 * @returns {Promise<{scannedCount: number, deletedCount: number, errorCount: number}>}
 */
export const syncRedisCacheWithS3 = async () => {
  let cursor = '0';
  let scannedCount = 0;
  let deletedCount = 0;
  let errorCount = 0;
  const scanPattern = `${REDIS_CACHE_PREFIX}*`;
  const scanCount = 100; // Process keys in batches

  console.log(`Starting Redis cache sync with S3 for pattern: ${scanPattern}`);

  try {
    do {
      // Scan for the next batch of keys
      // eslint-disable-next-line no-await-in-loop
      const reply = await redisClient.scan(cursor, 'MATCH', scanPattern, 'COUNT', scanCount);
      let keys; // Declare keys here to be used in the destructuring assignment
      [cursor, keys] = reply; // Destructure cursor and keys from scan result
      scannedCount += keys.length;

      if (keys.length > 0) {
        console.log(`Sync check: Processing batch of ${keys.length} keys (Cursor: ${cursor})`);

        // Create promises to check S3 existence for each key in the batch
        const checkPromises = keys.map(async (redisKey) => {
          try {
            // Extract original URL from Redis key
            const originalUrl = redisKey.substring(REDIS_CACHE_PREFIX.length);
            if (!originalUrl) {
              console.warn(`Sync check: Invalid Redis key format found: ${redisKey}. Skipping.`);
              return { status: 'skipped' };
            }

            // Get the expected S3 key
            const s3Key = getBlurredImageKey(originalUrl);
            const s3Params = { Bucket: config.aws.bucket, Key: s3Key };
            console.log(`Sync check: [${redisKey}] Derived S3 key: ${s3Key}`);
            console.log(`Sync check: [${redisKey}] Checking S3 with params:`, s3Params);

            // Check S3 object existence
            try {
              const headResult = await s3.headObject(s3Params).promise();
              console.log(`Sync check: [${redisKey}] S3 headObject SUCCEEDED. Result:`, JSON.stringify(headResult));
              // Check if Metadata is empty
              if (headResult.Metadata && Object.keys(headResult.Metadata).length === 0) {
                console.warn(
                  `Sync check: [${redisKey}] S3 object exists but has NO METADATA. Deleting S3 object and Redis key.`
                );
                try {
                  // Attempt to delete the S3 object
                  await s3Service.deleteObjects([{ Key: s3Key }]);
                  // Attempt to delete the Redis key
                  await redisClient.del(redisKey);
                  return { status: 'deleted_no_metadata' };
                } catch (deleteError) {
                  console.error(
                    `Sync check: [${redisKey}] Error deleting object/key with no metadata (S3 Key: ${s3Key}):`,
                    deleteError
                  );
                  return { status: 'error_deleting_no_metadata' };
                }
              } else {
                // S3 object exists and has metadata, cache is considered consistent for this check's purpose
                return { status: 'exists_with_metadata' };
              }
            } catch (s3Err) {
              console.log(
                `Sync check: [${redisKey}] S3 headObject FAILED. Error Code: ${s3Err.code}, Full Error:`,
                JSON.stringify(s3Err)
              );
              if (s3Err.code === 'NotFound' || s3Err.code === 'NoSuchKey') {
                // Object doesn't exist
                // Also check for NoSuchKey just in case
                console.warn(
                  `Sync check: S3 object NOT found for key ${s3Key} (Redis key: ${redisKey}). Deleting Redis key.`
                );
                // S3 object doesn't exist, delete the Redis key
                try {
                  await redisClient.del(redisKey);
                  return { status: 'deleted' };
                } catch (redisDelError) {
                  console.error(`Sync check: Failed to delete Redis key ${redisKey}:`, redisDelError);
                  return { status: 'error_redis_del' };
                }
              } else {
                // Other S3 error
                console.error(
                  `Sync check: S3 headObject error for key ${s3Key} (Redis key: ${redisKey}): Code: ${s3Err.code}`,
                  s3Err
                );
                return { status: 'error_s3_check' };
              }
            }
          } catch (processingError) {
            console.error(`Sync check: Error processing Redis key ${redisKey}:`, processingError);
            return { status: 'error_processing' };
          }
        });

        // Wait for all checks in the batch to complete
        // eslint-disable-next-line no-await-in-loop
        const results = await Promise.allSettled(checkPromises);

        // Count results for the batch
        // eslint-disable-next-line no-loop-func
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            if (result.value.status === 'deleted' || result.value.status === 'deleted_no_metadata') {
              deletedCount += 1;
            } else if (result.value.status && result.value.status.startsWith('error')) {
              errorCount += 1;
            }
          } else {
            // Promise rejected (unexpected error)
            console.error('Sync check: Unexpected error during S3 check promise:', result.reason);
            errorCount += 1;
          }
        });
      }
    } while (cursor !== '0'); // Continue scanning until the cursor returns to 0

    console.log(
      `Finished Redis cache sync with S3. Keys Scanned: ${scannedCount}, Stale Keys Deleted: ${deletedCount}, Errors: ${errorCount}`
    );
    return { scannedCount, deletedCount, errorCount };
  } catch (scanError) {
    console.error('FATAL Error during Redis SCAN operation:', scanError);
    // Return accumulated counts and the fatal error
    return { scannedCount, deletedCount, errorCount, error: scanError.message };
  }
};
