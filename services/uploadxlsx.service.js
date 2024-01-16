import { User } from 'models';

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
  //
  jsonData.forEach((userData) => {
    if (emailSet.has(userData.email)) {
      throw new Error(`Duplicate email found: ${userData.email}`);
    }
    if (!userData.email || userData.email.trim() === '') {
      throw new Error('email wes not added in data');
    }
    emailSet.add(userData.email);
  });
  //
  jsonData.forEach((userData) => {
    if (numberSet.has(userData.mobileNumber)) {
      throw new Error(`Duplicate mobileNumber found: ${userData.mobileNumber}`);
    }
    numberSet.add(userData.mobileNumber);
  });

  const data = await User.create(
    jsonData.map((userData) =>
      Object.assign(userData, {
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
