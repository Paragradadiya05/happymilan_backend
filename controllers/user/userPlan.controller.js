// eslint-disable-next-line import/no-extraneous-dependencies
import puppeteer from 'puppeteer';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { userPlanService } from '../../services';
import { UserPlan } from '../../models';

export const getUserPlanId = catchAsync(async (req, res) => {
  const userId = req.user._id;

  const filter = { userId };
  const options = {};
  const userPlan = await userPlanService.getOne(filter, options);

  if (!userPlan) {
    return res.status(httpStatus.NOT_FOUND).send({ message: 'User plan not found' });
  }

  const currentDate = new Date();

  // If the end date has passed and status is still active, mark it as inactive
  if (userPlan.endDate && userPlan.endDate < currentDate && userPlan.status !== 'inactive') {
    userPlan.status = 'inactive';
    await UserPlan.save();
  }

  return res.status(httpStatus.OK).send({ results: userPlan });
});

export const list = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const address = await userPlanService.getUserPlanList(filter, options);
  return res.status(httpStatus.OK).send({ results: address });
});

export const downloadUserPlanReceipt = catchAsync(async (req, res) => {
  const userId = req.user._id;

  // Fetch user plan
  const userPlan = await userPlanService.getOne({ userId });

  if (!userPlan) {
    return res.status(httpStatus.NOT_FOUND).send({ message: 'User plan not found' });
  }
  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };
  // HTML Template
  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Receipt</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
      .header { text-align: center; margin-bottom: 30px; }
      .header img { width: 120px; height: auto; margin-bottom: 10px; }
      .header h1 { margin: 5px 0 0 0; }
      .details, .table { width: 100%; margin-bottom: 20px; }
      .table { border-collapse: collapse; }
      .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: center; }
      .table th { background-color: #f2f2f2; }
      .footer { 
        position: fixed; 
        bottom: 20px; 
        left: 0; 
        right: 0; 
        text-align: center; 
        font-size: 14px; 
        color: #555; 
      }
    </style>
  </head>
  <body>
    <div class="header">
      <img src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/hapmeetlogo/68da85a84e96f5d8bc5620bb/hapmeetlogo.png" alt="logo"/>
      <h1>Plan Receipt</h1>
      <p>Thank you for your subscription</p>
    </div>

    <div class="details">
      <p><strong>Name:</strong> ${userPlan.userId.name || 'N/A'}</p>
      <p><strong>Email:</strong> ${userPlan.userId.email || 'N/A'}</p>
      <p><strong>Payment Method:</strong> ${userPlan.paymentMethod}</p>
      <p><strong>Status:</strong> ${userPlan.status}</p>
      <p><strong>Start Date:</strong> ${formatDate(userPlan.startDate)}</p>
      <p><strong>End Date:</strong> ${formatDate(userPlan.endDate)}</p>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Plan</th>
          <th>Price</th>
          <th>Discount %</th>
          <th>Discount Amount</th>
          <th>Total Pay</th>
          <th>Duration</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${userPlan.planId.planName}</td>
          <td>₹${userPlan.planId.price}</td>
          <td>${userPlan.planId.discount}%</td>
          <td>₹${userPlan.planId.discountAmount}</td>
          <td>₹${userPlan.planId.totalPrice}</td>
          <td>${userPlan.planId.planDuration}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      &copy; ${new Date().getFullYear()} MNtechgroup. All rights reserved.
    </div>
  </body>
  </html>
  `;

  // Launch Puppeteer and generate PDF
  const browser = await puppeteer.launch({
    executablePath: puppeteer.executablePath(), // auto-detect bundled Chromium
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  // Send PDF as binary
  res.writeHead(200, {
    'Content-Disposition': 'attachment; filename="UserPlanReceipt.pdf"',
    'Content-Type': 'application/pdf',
    'Content-Length': pdfBuffer.length,
  });
  res.end(pdfBuffer);
});
