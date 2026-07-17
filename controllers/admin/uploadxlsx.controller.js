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
    return res.status(400).send({
      success: false,
      message: 'No XLSX file uploaded',
    });
  }

  // Start processing in background
  xlsxservice.sendFromXlsx(req.files.uploaded_file, subject, template).catch((err) => {
    console.error('Email campaign failed:', err);
  });

  return res.status(httpStatus.OK).send({
    success: true,
    message: 'Email campaign started successfully',
  });
});

export const sendMailToAllUsers = catchAsync(async (req, res) => {
  const { subject, template } = req.body;

  const result = await xlsxservice.sendMailToAllUsers(subject, template);

  return res.status(httpStatus.OK).send({
    success: true,
    message: 'Emails sent successfully!',
    results: result,
  });
});

export const getAllCampaigns = catchAsync(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await xlsxservice.getAllCampaigns(page, limit);

  res.status(httpStatus.OK).send({
    success: true,
    message: 'Campaign list fetched successfully',
    ...result,
  });
});

export const getCampaignById = catchAsync(async (req, res) => {
  const campaign = await xlsxservice.getCampaignById(req.params.id);

  res.status(httpStatus.OK).send({
    success: true,
    message: 'Campaign fetched successfully',
    data: campaign,
  });
});

export const uploadVendors = catchAsync(async (req, res) => {
  if (!req.files || !req.files.uploaded_file) {
    return res.status(400).send({
      success: false,
      message: 'No file uploaded',
    });
  }

  const result = await xlsxservice.uploadVendors(req.files.uploaded_file);
  return res.status(httpStatus.OK).send({
    success: true,
    message: 'Vendors imported successfully',
    results: result,
  });
});
