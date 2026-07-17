import { User, Role, Address } from 'models';
import httpStatus from 'http-status';
import config from 'config/config';
import AWS from 'aws-sdk';
import axios from 'axios';
import EmailMarketing from '../models/emailMarketing.model';
import { sendEmail } from './email.service';
import { mailTemplateService } from './mailTemplate.service';
import ApiError from '../utils/ApiError';

AWS.config = new AWS.Config({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.bucketRegion,
});
const s3 = new AWS.S3({ apiVersion: '2006-03-01', signatureVersion: 'v4' });

// Ensure Role model is correctly imported
const xlsx = require('xlsx');

export async function uploadData(file) {
  const workbook = xlsx.read(file.data, { type: 'buffer' });
  const sheetNames = workbook.SheetNames;
  const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);

  if (sheetNames.length === 0) {
    throw new Error('Sheet has no data');
  }
  if (jsonData.length === 0) {
    throw new Error('Sheet has no data');
  }

  const emailSet = new Set();
  const numberSet = new Set();

  // Fetch the default role (e.g., "user") from the Role collection
  const defaultRole = await Role.findOne({ role: 'user' });
  if (!defaultRole) {
    throw new Error('Default role "user" not found in the database');
  }

  // First, check for duplicate emails and mobile numbers within the uploaded data
  // eslint-disable-next-line no-restricted-syntax
  for (const userData of jsonData) {
    if (emailSet.has(userData.email)) {
      throw new Error(`Duplicate email found in the uploaded file: ${userData.email}`);
    }
    if (!userData.email || userData.email.trim() === '') {
      throw new Error('Email was not added in data');
    }
    emailSet.add(userData.email);

    if (numberSet.has(userData.mobileNumber)) {
      throw new Error(`Duplicate mobile number found in the uploaded file: ${userData.mobileNumber}`);
    }
    numberSet.add(userData.mobileNumber);
  }

  // Now, check if any of these emails or mobile numbers already exist in the database
  const existingUsers = await User.find({
    $or: [{ email: { $in: Array.from(emailSet) } }],
  });

  if (existingUsers.length > 0) {
    const existingEmails = existingUsers.map((user) => user.email).join(', ');

    throw new Error(`Users with the following emails  already exist: Emails: ${existingEmails}`);
  }

  // Set default role as the ObjectId from the Role collection if it's not already provided
  const data = await User.create(
    jsonData.map((userData) =>
      Object.assign(userData, {
        role: userData.role ? userData.role : defaultRole._id, // Use the ObjectId of the default role
        ...(userData.dateOfBirth && {
          dateOfBirth: new Date((userData.dateOfBirth - 25569) * 86400 * 1000),
        }),
        ...(userData.birthTime && {
          birthTime: new Date((userData.birthTime - 25569) * 86400 * 1000),
        }),
        ...(userData.hideProfileDuration && {
          hideProfileDuration: new Date((userData.hideProfileDuration - 25569) * 86400 * 1000),
        }),
      })
    )
  );

  return data;
}

export async function getuploaddata(filter, options = {}) {
  const user = await User.find(filter, options.projection, options);
  return user;
}

export async function sendFromXlsx(file, subject, template) {
  const workbook = xlsx.read(file.data, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = xlsx.utils.sheet_to_json(sheet);

  if (!jsonData.length) {
    throw new Error('XLSX file has no data');
  }

  const contacts = jsonData
    .filter((row) => row.email)
    .map((row) => ({
      name: row.name || row.fullName || '',
      email: row.email,
    }));

  const marketingEntry = await EmailMarketing.create({
    subject,
    template,
    contacts,
    status: 'Processing',
    totalContacts: contacts.length,
    sentCount: 0,
    failedCount: 0,
  });

  let sentCount = 0;
  let failedCount = 0;
  const failedEmails = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const user of contacts) {
    try {
      const html = mailTemplateService.getTemplate(template, user.name);

      // eslint-disable-next-line no-await-in-loop
      await sendEmail({
        to: user.email,
        subject,
        text: html,
        isHtml: true,
      });

      // eslint-disable-next-line no-plusplus
      sentCount++;
      // eslint-disable-next-line no-plusplus,no-await-in-loop
      await EmailMarketing.findByIdAndUpdate(marketingEntry._id, {
        sentCount,
      });

      console.log(`✓ Sent ${sentCount}/${contacts.length} => ${user.email}`);
    } catch (error) {
      // eslint-disable-next-line no-plusplus
      failedCount++;

      failedEmails.push({
        email: user.email,
        error: error.message,
      });

      // eslint-disable-next-line no-await-in-loop
      await EmailMarketing.findByIdAndUpdate(marketingEntry._id, {
        failedCount,
      });

      console.error(`✗ Failed ${user.email}`, error.message);
    }

    // Optional delay to avoid SMTP rate limits
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  await EmailMarketing.findByIdAndUpdate(marketingEntry._id, {
    status: 'Completed',
    sentCount,
    failedCount,
    failedEmails,
    completedAt: new Date(),
  });

  console.log('Campaign completed');
  console.log('Total:', contacts.length);
  console.log('Sent:', sentCount);
  console.log('Failed:', failedCount);

  return {
    total: contacts.length,
    sentCount,
    failedCount,
  };
}

export async function sendMailToAllUsers(subject, template) {
  const users = await User.find({
    email: {
      $exists: true,
      $nin: ['', null],
      $regex: /@gmail\.com$/i,
    },
  })
    .select('firstName lastName email')
    .lean();
  if (!users.length) {
    throw new Error('No users found');
  }

  const contacts = users.map((user) => ({
    name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'User',
    email: user.email,
  }));

  const marketingEntry = await EmailMarketing.create({
    subject,
    template,
    contacts,
    status: 'Pending',
  });

  const successEmails = [];
  const failedEmails = [];

  // =========================
  // SEND SETTINGS
  // =========================

  const DELAY = 3000; // 3 seconds
  const MAX_RETRIES = 3;

  // =========================
  // HELPER FUNCTION
  // =========================

  const wait = (ms) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

  // =========================
  // SEND EMAILS
  // =========================

  // eslint-disable-next-line no-restricted-syntax
  for (const user of contacts) {
    let sent = false;
    let retryCount = 0;

    while (!sent && retryCount < MAX_RETRIES) {
      try {
        const html = mailTemplateService.getTemplate(template, user.name);

        // eslint-disable-next-line no-await-in-loop
        await sendEmail({
          to: user.email,
          subject,
          text: html,
          isHtml: true,
        });

        console.log(`✅ Email Sent: ${user.email}`);

        successEmails.push(user.email);

        sent = true;
      } catch (error) {
        retryCount += 1;

        console.log(`❌ Retry ${retryCount} Failed: ${user.email}`);

        // WAIT BEFORE RETRY
        // eslint-disable-next-line no-await-in-loop
        await wait(5000);

        if (retryCount === MAX_RETRIES) {
          failedEmails.push({
            email: user.email,
            error: error instanceof Error ? error.message : 'Unknown Error',
          });
        }
      }
    }

    // =========================
    // DELAY BETWEEN EMAILS
    // =========================

    // eslint-disable-next-line no-await-in-loop
    await wait(DELAY);
  }

  // =========================
  // UPDATE STATUS
  // =========================

  await EmailMarketing.findByIdAndUpdate(marketingEntry._id, {
    status: 'Completed',
  });
  console.log('==============================');
  console.log('EMAIL CAMPAIGN COMPLETED');
  console.log('==============================');
  console.log(`Total Users   : ${contacts.length}`);
  console.log(`Success Count : ${successEmails.length}`);
  console.log(`Failed Count  : ${failedEmails.length}`);

  if (failedEmails.length) {
    console.log('Failed Emails:');

    failedEmails.forEach((item) => {
      console.log(`${item.email} - ${item.error}`);
    });
  }

  console.log('==============================');

  return {
    totalUsers: contacts.length,
    successCount: successEmails.length,
    failedCount: failedEmails.length,
    failedEmails,
  };
}

export const getAllCampaigns = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [campaigns, totalResults] = await Promise.all([
    EmailMarketing.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    EmailMarketing.countDocuments(),
  ]);

  return {
    results: campaigns,
    page,
    limit,
    totalPages: Math.ceil(totalResults / limit),
    totalResults,
  };
};

export const getCampaignById = async (campaignId) => {
  const campaign = await EmailMarketing.findById(campaignId).lean();

  if (!campaign) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Campaign not found');
  }

  campaign.progress =
    campaign.totalContacts > 0
      ? Math.round(((campaign.sentCount + campaign.failedCount) / campaign.totalContacts) * 100)
      : 0;

  return campaign;
};

const processVendorImagesInBackground = async (tasks) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const task of tasks) {
    const { userId, email, profilePic, imageUrls, image1Url, image2Url, image3Url, image4Url, image5Url } = task;

    const errors = [];
    let profilePicUrl = '';
    const userProfilePicArray = [];

    // Collect all image URLs to process
    const urlsToDownload = [];
    if (profilePic && profilePic.trim().startsWith('http')) {
      urlsToDownload.push({ type: 'profile', url: profilePic.trim() });
    }
    if (imageUrls && imageUrls.trim()) {
      imageUrls.split(',').forEach((u) => {
        if (u.trim().startsWith('http')) {
          urlsToDownload.push({ type: 'gallery', url: u.trim() });
        }
      });
    }
    if (image1Url && image1Url.trim().startsWith('http')) {
      urlsToDownload.push({ type: 'gallery', url: image1Url.trim() });
    }
    if (image2Url && image2Url.trim().startsWith('http')) {
      urlsToDownload.push({ type: 'gallery', url: image2Url.trim() });
    }
    if (image3Url && image3Url.trim().startsWith('http')) {
      urlsToDownload.push({ type: 'gallery', url: image3Url.trim() });
    }
    if (image4Url && image4Url.trim().startsWith('http')) {
      urlsToDownload.push({ type: 'gallery', url: image4Url.trim() });
    }
    if (image5Url && image5Url.trim().startsWith('http')) {
      urlsToDownload.push({ type: 'gallery', url: image5Url.trim() });
    }

    // Process each image sequentially
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < urlsToDownload.length; i++) {
      const item = urlsToDownload[i];
      try {
        // eslint-disable-next-line no-await-in-loop
        const imageResponse = await axios.get(item.url, { responseType: 'arraybuffer', timeout: 15000 });
        const buffer = Buffer.from(imageResponse.data, 'binary');
        const contentType = imageResponse.headers['content-type'] || 'image/jpeg';
        let extension = contentType.split('/')[1] || 'jpg';
        if (extension === 'jpeg') extension = 'jpg';
        const key = `users/vendors/${Date.now()}_${email.replace(/[@.]/g, '_')}_${i}.${extension}`;

        // eslint-disable-next-line no-await-in-loop
        const uploadResult = await s3
          .upload({
            Bucket: config.aws.bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            ACL: 'public-read',
          })
          .promise();

        if (item.type === 'profile') {
          profilePicUrl = uploadResult.Location;
          userProfilePicArray.push({ url: uploadResult.Location, name: key });
        } else {
          userProfilePicArray.push({ url: uploadResult.Location, name: key });
        }
      } catch (err) {
        const errorMsg = `Failed to process image (${item.url}): ${err.message}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Update the User document with S3 URLs and any encountered errors
    try {
      const updatePayload = {};
      if (profilePicUrl) {
        updatePayload.profilePic = profilePicUrl;
      }
      if (userProfilePicArray.length > 0) {
        updatePayload.$addToSet = {
          userProfilePic: { $each: userProfilePicArray },
        };
      }
      if (errors.length > 0) {
        updatePayload.importErrors = errors;
      }

      if (Object.keys(updatePayload).length > 0) {
        // eslint-disable-next-line no-await-in-loop
        await User.findByIdAndUpdate(userId, updatePayload);
        console.log(`Successfully completed background image processing for: ${email}`);
      }
    } catch (dbErr) {
      console.error(`Failed to update user ${email} in background:`, dbErr.message);
    }
  }
};

export const uploadVendors = async (file) => {
  const workbook = xlsx.read(file.data, { type: 'buffer' });
  const sheetNames = workbook.SheetNames;
  if (sheetNames.length === 0) {
    throw new Error('Sheet has no data');
  }
  const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
  if (jsonData.length === 0) {
    throw new Error('Sheet has no data');
  }

  // 1. Get or Create the vendor role
  let vendorRole = await Role.findOne({ role: 'vendor' });
  if (!vendorRole) {
    vendorRole = await Role.create({
      role: 'vendor',
      dashboard: { view: true, add: true, update: true, delete: true },
      plans: { view: true, add: true, update: true, delete: true },
      emailMarketing: { view: true, add: true, update: true, delete: true },
      paymentAndReceipts: { view: true, add: true, update: true, delete: true },
      User: { view: true, add: true, update: true, delete: true },
      blogs: { view: true, add: true, update: true, delete: true },
      roles: { view: true, add: true, update: true, delete: true },
      successStories: { view: true, add: true, update: true, delete: true },
    });
  }

  const createdUsers = [];
  const backgroundTasks = [];

  // 2. Loop through each row of the sheet to create accounts immediately
  // eslint-disable-next-line no-restricted-syntax
  for (const row of jsonData) {
    const {
      email,
      password,
      mobileNumber,
      firstName,
      lastName,
      businessName,
      businessDescription,
      businessType,
      servicesProvided,
      subServices,
      currentResidenceAddress,
      area,
      currentCity,
      currentState,
      currentCountry,
      profilePic,
      imageUrls,
      image1Url,
      image2Url,
      image3Url,
      image4Url,
      image5Url,
    } = row;

    if (!email || email.trim() === '') {
      throw new Error('Email is required for all rows');
    }
    if (!password || password.trim() === '') {
      throw new Error(`Password is required for user with email ${email}`);
    }

    // Check duplicate email
    // eslint-disable-next-line no-await-in-loop
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      console.log(`User already exists with email: ${email}`);
      // eslint-disable-next-line no-continue
      continue;
    }

    // Clean and normalize enum values to prevent validation failures
    const cleanedBusinessType = businessType
      ? businessType
          .toLowerCase()
          .trim()
          .replace(/[\s_]+/g, '-')
      : '';
    const cleanedServicesProvided = servicesProvided
      ? servicesProvided.split(',').map((s) =>
          s
            .toLowerCase()
            .trim()
            .replace(/[\s_]+/g, '-')
        )
      : [];

    // Create the User with vendorData
    // eslint-disable-next-line no-await-in-loop
    const newUser = await User.create({
      email,
      password, // Mongoose pre-save hook will automatically hash this once on save
      mobileNumber: mobileNumber || undefined,
      firstName: firstName || businessName, // Default to businessName if firstName is not provided
      lastName: lastName || '',
      role: vendorRole._id,
      isUserActive: true,
      emailVerified: true,
      appUsesType: 'vendor',
      vendorData: [
        {
          businessName: businessName || firstName,
          businessDescription: businessDescription || '',
          businessType: cleanedBusinessType,
          servicesProvided: cleanedServicesProvided,
          subServices: subServices || '',
        },
      ],
    });

    // Create the associated Address
    // eslint-disable-next-line no-await-in-loop
    const newAddress = await Address.create({
      userId: newUser._id,
      currentResidenceAddress: currentResidenceAddress || '',
      area: area || '',
      currentCity: currentCity || '',
      currentState: currentState || '',
      currentCountry: currentCountry || 'India', // default
    });

    // Link the address document back to the user
    newUser.address = newAddress._id;
    // eslint-disable-next-line no-await-in-loop
    await newUser.save();

    // Push task parameters for background execution
    backgroundTasks.push({
      userId: newUser._id,
      email: newUser.email,
      profilePic,
      imageUrls,
      image1Url,
      image2Url,
      image3Url,
      image4Url,
      image5Url,
    });

    createdUsers.push(newUser);
  }

  // Trigger background image download & S3 upload without blocking the HTTP response
  if (backgroundTasks.length > 0) {
    processVendorImagesInBackground(backgroundTasks).catch((err) => {
      console.error('Background processing error:', err);
    });
  }

  return createdUsers;
};
