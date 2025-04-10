// services/imageblur.service.js
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import os from 'os';
import axios from 'axios';
import AWS from 'aws-sdk';
import { TempS3 } from 'models';
import config from 'config/config';
import * as s3Service from './s3.service';

// Initialize S3 client
const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  signatureVersion: 'v4',
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: process.env.AWS_BUCKET_REGION,
});

// Cache to store already blurred image URLs to prevent reprocessing
const blurredImagesCache = new Map();

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
 * @returns {Promise<boolean>} - Whether the blurred image exists
 */
const checkIfBlurredImageExists = async (key) => {
  try {
    // First check the database for this key
    const existingRecord = await TempS3.findOne({ key, isBlurred: true });
    if (existingRecord) {
      return { exists: true, url: existingRecord.url };
    }

    // If not in database, check S3 directly
    const params = {
      Bucket: config.aws.bucket,
      Key: key,
    };

    try {
      await s3.headObject(params).promise();
      // If no error, the object exists
      const url = `https://${config.aws.bucket}.s3.amazonaws.com/${key}`;

      // Add to database for future lookups
      await TempS3.create({
        url,
        key,
        createdAt: new Date(),
        isBlurred: true,
      });

      return { exists: true, url };
    } catch (err) {
      if (err.code === 'NotFound') {
        return { exists: false };
      }
      throw err;
    }
  } catch (error) {
    console.error('Error checking if blurred image exists:', error);
    return { exists: false };
  }
};

/**
 * Creates a blurred version of an image
 * @param {string} originalUrl - Original image URL
 * @param {number} blurAmount - Blur intensity (1-100)
 * @returns {Promise<string>} - URL of the blurred image
 */
export const blurImage = async (originalUrl, blurAmount = 35) => {
  // Check if this image has already been blurred (in-memory cache check)
  if (blurredImagesCache.has(originalUrl)) {
    return blurredImagesCache.get(originalUrl);
  }

  let outputPath = null;

  try {
    // Generate a consistent key for the blurred version
    const blurredKey = getBlurredImageKey(originalUrl);

    // Check if a blurred version already exists in S3
    const existingBlurredImage = await checkIfBlurredImageExists(blurredKey);
    if (existingBlurredImage.exists) {
      // Update cache and return existing URL
      blurredImagesCache.set(originalUrl, existingBlurredImage.url);
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

    // Cache the result
    blurredImagesCache.set(originalUrl, uploadResult);

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
 * Cleanup old blurred images (to be run as a cron job)
 * @param {number} maxAgeHours - Maximum age in hours before deleting temporary blurred images
 */
export const cleanupBlurredImages = async (maxAgeHours = 24) => {
  try {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() - maxAgeHours);

    const expiredBlurredImages = await TempS3.find({
      isBlurred: true,
      createdAt: { $lt: expirationDate },
    });

    if (expiredBlurredImages.length === 0) {
      return { deleted: 0 };
    }

    // Delete from S3
    const keys = expiredBlurredImages.map((image) => ({ Key: image.key }));
    await s3Service.deleteObjects(keys);

    // Delete from database
    await TempS3.deleteMany({
      _id: { $in: expiredBlurredImages.map((img) => img._id) },
    });

    // Clear cache entries for deleted images
    expiredBlurredImages.forEach((image) => {
      blurredImagesCache.delete(image.url);
    });

    return { deleted: expiredBlurredImages.length };
  } catch (error) {
    console.error('Error cleaning up blurred images:', error);
    throw error;
  }
};
