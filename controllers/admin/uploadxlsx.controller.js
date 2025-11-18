import httpStatus from 'http-status';
import { xlsxservice } from '../../services';
import { catchAsync } from '../../utils/catchAsync';

export const uploadxlsx = catchAsync(async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }
  if (!req.files) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }
  const xlsx = await xlsxservice.uploadData(req.files.uploaded_file);
  return res.status(httpStatus.OK).send({ results: xlsx });
});
export const list = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const xlsx = await xlsxservice.getuploaddata(filter, options);
  return res.status(httpStatus.OK).send({ results: xlsx });
});

export const sendFromXlsx = catchAsync(async (req, res) => {
  const { subject, template } = req.body;

  if (!req.files || !req.files.uploaded_file) {
    return res.status(400).send('No XLSX file uploaded');
  }

  const result = await xlsxservice.sendFromXlsx(req.files.uploaded_file, subject, template);

  return res.status(httpStatus.OK).send({
    success: true,
    message: 'Emails sent successfully!',
    results: result,
  });
});
