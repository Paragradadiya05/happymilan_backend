import { User } from 'models';

const xlsx = require('xlsx');

export async function uploadData(file) {
  const workbook = xlsx.read(file.data, { type: 'buffer' });
  const sheetNames = workbook.SheetNames;
  const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
  if (sheetNames.length === 0) {
    throw new Error('Sheet has no data');
  }

  const data = await User.create(
    jsonData.map((userData) =>
      Object.assign(userData, {
        ...(userData.dateOfBirth && {
          dateOfBirth: new Date((userData.dateOfBirth - (25567 + 1)) * 86400 * 1000),
        }),
        ...(userData.birthTime && {
          birthTime: new Date((userData.birthTime - (25567 + 1)) * 86400 * 1000),
        }),
        ...(userData.hideProfileDuration && {
          hideProfileDuration: new Date((userData.hideProfileDuration - (25567 + 1)) * 86400 * 1000),
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
