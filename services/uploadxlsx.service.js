import { User, Role } from 'models';
import EmailMarketing from '../models/emailMarketing.model';
import { sendEmail } from './email.service';
import { mailTemplateService } from './mailTemplate.service';
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

  // map contacts
  const contacts = jsonData.map((row) => ({
    name: row.name || row.fullName || '',
    email: row.email,
  }));

  // Save activity
  const marketingEntry = await EmailMarketing.create({
    subject,
    template,
    contacts,
  });

  // Send emails
  // eslint-disable-next-line no-restricted-syntax
  for (const user of contacts) {
    const html = mailTemplateService.getTemplate(template, user.name);

    // eslint-disable-next-line no-await-in-loop
    await sendEmail({
      to: user.email,
      subject,
      text: html,
      isHtml: true,
    });
  }

  await EmailMarketing.findByIdAndUpdate(marketingEntry._id, {
    status: 'Completed',
  });

  return contacts;
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
