import { TempS3 } from 'models';
import { imageBlurService } from './index';
import * as s3Service from './s3.service';

/**
 * Cleans up temporary S3 files
 */
// eslint-disable-next-line import/prefer-default-export
export const cleanupTempS3 = async () => {
  try {
    const inactiveFiles = await TempS3.find({ active: false });
    if (inactiveFiles.length > 0) {
      const keys = inactiveFiles.map((file) => ({ Key: file.key }));
      await s3Service.deleteObjects(keys);
      await TempS3.deleteMany({ active: false });
    }

    // Additionally, clean up blurred images
    await imageBlurService.cleanupBlurredImages(24); // Remove blurred images older than 24 hours

    return { success: true, message: 'Temp S3 objects cleaned up successfully' };
  } catch (e) {
    console.error('Failed to clean up temp S3 objects', e);
    return { success: false, message: 'Failed to clean up temp S3 objects', error: e.message };
  }
};
