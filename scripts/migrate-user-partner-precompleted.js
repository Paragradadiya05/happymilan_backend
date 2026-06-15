import mongoose from 'mongoose';
import config from '../config/config';
import UserModel from '../models/user.model';

const runMigration = async () => {
  try {
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    console.log('Connected to MongoDB');

    // Only update privacySettingCustom arrays to include 'userPartnerPreCompleted'
    const result = await UserModel.updateMany(
      { 'privacySettingCustom.publicProfile': { $exists: true } },
      {
        $addToSet: {
          'privacySettingCustom.publicProfile': 'userPartnerPreCompleted',
          'privacySettingCustom.privateProfile': 'userPartnerPreCompleted',
          'privacySettingCustom.premiumProfile': 'userPartnerPreCompleted',
        },
      }
    );
    console.log(`Updated privacy settings list for ${result.nModified || result.modifiedCount || 0} users`);

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
