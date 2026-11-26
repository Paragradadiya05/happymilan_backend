/* eslint-disable */
import mongoose from 'mongoose';
import config from '../config/config';

/**
 * Migration Script: Migrate database for new fields:
 * - UserPartner: weight ({ min: 40, max: 120 }), religion ([]), caste ([]), cast ([])
 * - User: sync caste and cast, update privacySettingCustom with new fields
 */

const normalizeArrayField = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) {
    // Flatten any 2D arrays (e.g. [["Hindu"]] -> ["Hindu"])
    const flat = val.flat(Infinity).filter((item) => item !== null && item !== undefined && item !== '');
    return Array.from(new Set(flat));
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
};

const runMigration = async () => {
  try {
    console.log('--- Starting Database Migration for New Partner Fields ---');
    console.log(`Connecting to MongoDB at: ${config.mongoose.url}`);
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    console.log('Connected to MongoDB successfully.\n');

    const db = mongoose.connection.db;
    const partnerCollection = db.collection('UserPartner');
    const userCollection = db.collection('User');

    // ========================================================
    // 1. MIGRATE UserPartner COLLECTION
    // ========================================================
    console.log('>> Step 1: Migrating UserPartner collection...');

    // 1a. Set default weight where missing or null
    const weightMissingResult = await partnerCollection.updateMany(
      {
        $or: [
          { weight: { $exists: false } },
          { weight: null },
          { 'weight.min': { $exists: false } },
          { 'weight.max': { $exists: false } },
          { 'weight.min': null },
          { 'weight.max': null },
        ],
      },
      {
        $set: {
          weight: { min: 40, max: 120 },
        },
      }
    );
    console.log(` - Default weight ({ min: 40, max: 120 }) applied to ${weightMissingResult.modifiedCount || weightMissingResult.nModified || 0} partner records.`);

    // 1b. Set default empty array for religion where missing or null
    const religionMissingResult = await partnerCollection.updateMany(
      {
        $or: [{ religion: { $exists: false } }, { religion: null }],
      },
      {
        $set: { religion: [] },
      }
    );
    console.log(` - Default religion ([]) applied to ${religionMissingResult.modifiedCount || religionMissingResult.nModified || 0} partner records.`);

    // 1c. Set default empty array for caste and cast where missing or null
    const casteMissingResult = await partnerCollection.updateMany(
      {
        $or: [{ caste: { $exists: false } }, { caste: null }],
      },
      {
        $set: { caste: [] },
      }
    );
    console.log(` - Default caste ([]) applied to ${casteMissingResult.modifiedCount || casteMissingResult.nModified || 0} partner records.`);

    const castMissingResult = await partnerCollection.updateMany(
      {
        $or: [{ cast: { $exists: false } }, { cast: null }],
      },
      {
        $set: { cast: [] },
      }
    );
    console.log(` - Default cast ([]) applied to ${castMissingResult.modifiedCount || castMissingResult.nModified || 0} partner records.`);

    // 1d. Sync and normalize non-array or out-of-sync fields in UserPartner
    console.log(' - Normalizing arrays and syncing caste <-> cast in UserPartner...');
    const partnerCursor = partnerCollection.find({
      $or: [
        { religion: { $type: 'string' } },
        { caste: { $type: 'string' } },
        { cast: { $type: 'string' } },
        { $expr: { $ne: ['$caste', '$cast'] } },
      ],
    });

    const partnerBulkOps = [];
    let syncedPartnerCount = 0;
    while (await partnerCursor.hasNext()) {
      const doc = await partnerCursor.next();
      const normReligion = normalizeArrayField(doc.religion);
      let normCaste = normalizeArrayField(doc.caste);
      let normCast = normalizeArrayField(doc.cast);

      // Sync caste and cast
      if (normCaste.length && !normCast.length) {
        normCast = [...normCaste];
      } else if (normCast.length && !normCaste.length) {
        normCaste = [...normCast];
      } else if (normCaste.length && normCast.length) {
        // Union
        const union = Array.from(new Set([...normCaste, ...normCast]));
        normCaste = union;
        normCast = union;
      }

      partnerBulkOps.push({
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: {
              religion: normReligion,
              caste: normCaste,
              cast: normCast,
            },
          },
        },
      });
      syncedPartnerCount += 1;

      if (partnerBulkOps.length >= 500) {
        await partnerCollection.bulkWrite(partnerBulkOps);
        partnerBulkOps.length = 0;
      }
    }
    if (partnerBulkOps.length > 0) {
      await partnerCollection.bulkWrite(partnerBulkOps);
    }
    console.log(` - UserPartner normalization and synchronization finished (${syncedPartnerCount} records processed).\n`);

    // ========================================================
    // 2. MIGRATE User COLLECTION
    // ========================================================
    console.log('>> Step 2: Migrating User collection...');

    // 2a. Sync caste to cast on User profiles where caste exists but cast is missing
    const userCursor1 = userCollection.find({
      caste: { $exists: true, $nin: [null, ''] },
      $or: [{ cast: { $exists: false } }, { cast: null }, { cast: '' }],
    });
    const userBulkOps1 = [];
    let syncedCasteToCastCount = 0;
    while (await userCursor1.hasNext()) {
      const u = await userCursor1.next();
      userBulkOps1.push({
        updateOne: {
          filter: { _id: u._id },
          update: { $set: { cast: u.caste } },
        },
      });
      syncedCasteToCastCount += 1;
      if (userBulkOps1.length >= 500) {
        await userCollection.bulkWrite(userBulkOps1);
        userBulkOps1.length = 0;
      }
    }
    if (userBulkOps1.length > 0) {
      await userCollection.bulkWrite(userBulkOps1);
    }
    console.log(` - Synced caste -> cast on ${syncedCasteToCastCount} users.`);

    // 2b. Sync cast to caste on User profiles where cast exists but caste is missing
    const userCursor2 = userCollection.find({
      cast: { $exists: true, $nin: [null, ''] },
      $or: [{ caste: { $exists: false } }, { caste: null }, { caste: '' }],
    });
    const userBulkOps2 = [];
    let syncedCastToCasteCount = 0;
    while (await userCursor2.hasNext()) {
      const u = await userCursor2.next();
      userBulkOps2.push({
        updateOne: {
          filter: { _id: u._id },
          update: { $set: { caste: u.cast } },
        },
      });
      syncedCastToCasteCount += 1;
      if (userBulkOps2.length >= 500) {
        await userCollection.bulkWrite(userBulkOps2);
        userBulkOps2.length = 0;
      }
    }
    if (userBulkOps2.length > 0) {
      await userCollection.bulkWrite(userBulkOps2);
    }
    console.log(` - Synced cast -> caste on ${syncedCastToCasteCount} users.`);

    // 2c. Update privacySettingCustom for all users to include the new fields
    const newPrivacyFields = ['religion', 'caste', 'cast', 'weight', 'userPartnerPreCompleted'];
    const privacyResult = await userCollection.updateMany(
      { 'privacySettingCustom.publicProfile': { $exists: true } },
      {
        $addToSet: {
          'privacySettingCustom.publicProfile': { $each: newPrivacyFields },
          'privacySettingCustom.privateProfile': { $each: newPrivacyFields },
          'privacySettingCustom.premiumProfile': { $each: newPrivacyFields },
        },
      }
    );
    console.log(` - Updated privacySettingCustom (added ${newPrivacyFields.join(', ')}) for ${privacyResult.modifiedCount || privacyResult.nModified || 0} users.`);

    console.log('\n========================================================');
    console.log('Database migration completed successfully with NO errors!');
    console.log('========================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed with error:', error);
    process.exit(1);
  }
};

runMigration();
