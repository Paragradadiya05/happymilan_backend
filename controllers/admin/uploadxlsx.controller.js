import httpStatus from 'http-status';
import { xlsxservice } from '../../services';
import { catchAsync } from '../../utils/catchAsync';

export const uploadxlsx = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }
  const { path } = req.file;
  await xlsxservice.uploadData(path);
  const options = {};
  const xlsx = await xlsxservice.uploadData(req.body, options);
  return res.status(httpStatus.OK).send({ results: xlsx });
});
export const list = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const xlsx = await xlsxservice.getuploaddata(filter, options);
  return res.status(httpStatus.OK).send({ results: xlsx });
});
