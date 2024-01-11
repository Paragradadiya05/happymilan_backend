import { User } from 'models';

const xlsx = require('xlsx');

export async function uploadData(path) {
  console.log('filePath====', path);
  const workbook = xlsx.readFile(path);
  console.log('====w', workbook);
  const sheetNames = workbook.SheetNames;
  console.log('====s', sheetNames);
  const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
  console.log('====jeson', jsonData);
  if (sheetNames.length === 0) {
    throw new Error('Sheet has no data');
  }
  const data = await User.insertMany(jsonData);
  return data;
}
export async function getuploaddata(filter, options = {}) {
  const user = await User.find(filter, options.projection, options);
  return user;
}
