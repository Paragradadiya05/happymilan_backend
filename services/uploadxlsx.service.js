import { User, Role } from 'models';
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
