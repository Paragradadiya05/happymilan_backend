import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';
import { claimRequestService, userService, emailService } from '../../services';
import { catchAsync } from '../../utils/catchAsync';
import { pick } from '../../utils/pick';
import ApiError from '../../utils/ApiError';
import { User } from '../../models';

// User requests access
export const createRequest = catchAsync(async (req, res) => {
  const { body } = req;
  const userId = req.user ? req.user._id : undefined;

  // 1. Verify vendor exists
  const vendor = await userService.getUserById(body.vendorId);
  if (!vendor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Business listing (vendor) not found');
  }

  // 2. Check if already claimed
  if (vendor.vendorData && vendor.vendorData.length > 0 && vendor.vendorData[0].claimed) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This business is already claimed and verified.');
  }

  // 2b. Check if claim request is already in progress
  const existingPending = await claimRequestService.getOne({
    vendorId: body.vendorId,
    status: 'pending',
  });
  if (existingPending) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'A claim request for this business is already in progress.');
  }

  // 3. Create the claim request
  const claimData = {
    ...body,
    status: 'pending',
  };
  if (userId) {
    claimData.userId = userId;
  }

  const claimRequest = await claimRequestService.createClaimRequest(claimData);

  // 4. Set requested flag on vendorData
  if (vendor.vendorData && vendor.vendorData.length > 0) {
    await User.updateOne(
      { _id: vendor._id, 'vendorData._id': vendor.vendorData[0]._id },
      { $set: { 'vendorData.$.requested': true } }
    );
  }

  res.status(httpStatus.CREATED).send({
    message: 'Claim request submitted successfully.',
    results: claimRequest,
  });
});

// User views their own requests
export const getMyRequests = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const filter = { userId };
  const requests = await claimRequestService.getClaimRequests(filter);
  res.status(httpStatus.OK).send({ results: requests });
});

// Admin lists all claim requests
export const listAllRequests = catchAsync(async (req, res) => {
  const { query } = req;
  const filter = {};
  if (query.status) {
    filter.status = query.status;
  }
  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = {
    [sortingObj.sort || 'createdAt']: sortingObj.order || 'desc',
  };
  const options = {
    sort: sortObj,
    page: parseInt(query.page, 10) || 1,
    limit: parseInt(query.limit, 10) || 10,
    populate: 'userId vendorId',
  };
  const paginatedResults = await claimRequestService.getClaimRequestsWithPagination(filter, options);
  res.status(httpStatus.OK).send({ results: paginatedResults });
});

// Admin verify claim request (Approve/Reject)
export const verifyRequest = catchAsync(async (req, res) => {
  const { requestId } = req.params;
  const { status, rejectionReason } = req.body;

  const request = await claimRequestService.getClaimRequestById(requestId);
  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Claim request not found');
  }

  if (request.status !== 'pending') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This claim request has already been processed');
  }

  const vendor = await User.findById(request.vendorId);
  if (!vendor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Vendor profile associated with request not found');
  }

  const targetEmail = request.email || (request.userId && request.userId.email) || vendor.email;

  request.status = status;
  if (status === 'rejected') {
    request.rejectionReason = rejectionReason;
  }
  await request.save();

  if (status === 'approved') {
    const tempPassword = Math.random().toString(36).slice(-10);

    // Update vendorData to claimed and reset password + update vendor account email to claimant's target email
    if (vendor.vendorData && vendor.vendorData.length > 0) {
      await User.updateOne(
        { _id: vendor._id, 'vendorData._id': vendor.vendorData[0]._id },
        {
          $set: {
            'vendorData.$.claimed': true,
            'vendorData.$.requested': false,
            'vendorData.$.claimedBy': request.userId,
          },
        }
      );
    }
    const hashedPassword = await bcrypt.hash(tempPassword, 8);
    await User.updateOne({ _id: vendor._id }, { $set: { email: targetEmail, password: hashedPassword } });

    // Send Approval Mail with credentials
    try {
      console.log(`Sending claim approval email to ${targetEmail}...`);
      await emailService.sendEmail({
        to: targetEmail,
        subject: `Your Ownership Claim Verified - ${request.businessName}`,
        isHtml: true,
        text: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ownership Claim Verified</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f0f4f9; font-family: 'Poppins', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
            <table width="100%" bgcolor="#f0f4f9" cellspacing="0" cellpadding="0" style="padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="600" bgcolor="#ffffff" cellspacing="0" cellpadding="0" style="border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); padding: 40px; margin-bottom: 20px; box-sizing: border-box;">
                    <!-- Logo -->
                    <tr>
                      <td align="left" style="padding-bottom: 30px;">
                        <img src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/hapmeet_logo/6a0d40c2e3bb1a7796d70239/hapmeet.jpg" width="150" alt="Hapmeet Logo" style="display: block; border: 0;"/>
                      </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                      <td align="left" style="font-size: 14px; color: #4a4a4a; line-height: 1.6;">
                        <p style="margin: 0 0 15px 0;">Dear ${request.fullName},</p>
                        <p style="margin: 0 0 25px 0;">Your business ownership for <strong>${request.businessName}</strong> has been successfully verified. You now have access to manage this business profile.</p>
                        
                        <p style="margin: 0 0 10px 0; font-weight: bold; color: #1a1a1a;">Temporary Credentials</p>
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #1a1a1a;">
                          <strong>Registered Email:</strong> ${targetEmail}<br/>
                          <strong>Temporary Password:</strong> ${tempPassword}
                        </p>

                        
                        <p style="margin: 25px 0 25px 0;">For your security, please sign in using the temporary password and change it immediately after your first login.</p>
                        <p style="margin: 0 0 25px 0;">Thank you for choosing Hapmeet.</p>
                      </td>
                    </tr>
                    <!-- Button -->
                    <tr>
                      <td align="left" style="padding-bottom: 25px;">
                        <a href="https://hapmeet.com" target="_blank" style="display: inline-block; background-color: #6C5CE7; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 30px; font-size: 14px; font-weight: bold; text-align: center;">Manage Business</a>
                      </td>
                    </tr>
                    <!-- Sign-off -->
                    <tr>
                      <td align="left" style="font-size: 14px; color: #4a4a4a; line-height: 1.6; border-top: 1px solid #eeeeee; padding-top: 20px;">
                        Best regards,<br/>
                        <strong>Hapmeet Team</strong>
                      </td>
                    </tr>
                  </table>

                  <!-- Footer -->
                  <table width="600" cellspacing="0" cellpadding="0" style="text-align: center; font-size: 11px; color: #8a8a8a; line-height: 1.6;">
                    <tr>
                      <td style="padding: 0 20px 20px 20px;">
                        Welcome to HappyMilan your hub for finding a life partner, exploring dating opportunities, and making new friends. Join us to connect with a vibrant community and discover meaningful relationships.
                      </td>
                    </tr>
                    <!-- Social Icons -->
                    <tr>
                      <td align="center" style="padding-bottom: 20px;">
                        <table cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="padding: 0 10px;">
                              <a href="https://youtube.com" target="_blank"><img src="https://img.icons8.com/ios-filled/50/8a8a8a/youtube-play.png" width="24" height="24" alt="YouTube" style="display:block; border:0;"/></a>
                            </td>
                            <td style="padding: 0 10px;">
                              <a href="https://facebook.com" target="_blank"><img src="https://img.icons8.com/ios-filled/50/8a8a8a/facebook-new.png" width="24" height="24" alt="Facebook" style="display:block; border:0;"/></a>
                            </td>
                            <td style="padding: 0 10px;">
                              <a href="https://instagram.com" target="_blank"><img src="https://img.icons8.com/ios-filled/50/8a8a8a/instagram-new.png" width="24" height="24" alt="Instagram" style="display:block; border:0;"/></a>
                            </td>
                            <td style="padding: 0 10px;">
                              <a href="https://twitter.com" target="_blank"><img src="https://img.icons8.com/ios-filled/50/8a8a8a/twitter.png" width="24" height="24" alt="Twitter" style="display:block; border:0;"/></a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <!-- Unsubscribe -->
                    <tr>
                      <td style="font-size: 10px; color: #8a8a8a; padding-bottom: 20px;">
                        If you prefer not to receive these emails in the future, please <a href="https://hapmeet.com/unsubscribe" target="_blank" style="color: #6C5CE7; text-decoration: none;">unsubscribe here</a>.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });
    } catch (err) {
      // Log mail error but do not fail the request
      console.error('Failed to send claim approval email:', err);
    }
  } else if (status === 'rejected') {
    if (vendor.vendorData && vendor.vendorData.length > 0) {
      await User.updateOne(
        { _id: vendor._id, 'vendorData._id': vendor.vendorData[0]._id },
        {
          $set: {
            'vendorData.$.claimed': false,
            'vendorData.$.requested': false,
          },
        }
      );
    }

    // Send Rejection Mail
    try {
      console.log(`Sending claim rejection email to ${targetEmail}...`);
      await emailService.sendEmail({
        to: targetEmail,
        subject: `Your Ownership Claim Rejected - ${request.businessName}`,
        isHtml: true,
        text: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ownership Claim Rejected</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f0f4f9; font-family: 'Poppins', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
            <table width="100%" bgcolor="#f0f4f9" cellspacing="0" cellpadding="0" style="padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="600" bgcolor="#ffffff" cellspacing="0" cellpadding="0" style="border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); padding: 40px; margin-bottom: 20px; box-sizing: border-box;">
                    <!-- Logo -->
                    <tr>
                      <td align="left" style="padding-bottom: 30px;">
                        <img src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/hapmeet_logo/6a0d40c2e3bb1a7796d70239/hapmeet.jpg" width="150" alt="Hapmeet Logo" style="display: block; border: 0;"/>
                      </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                      <td align="left" style="font-size: 14px; color: #4a4a4a; line-height: 1.6;">
                        <p style="margin: 0 0 15px 0;">Dear ${request.fullName},</p>
                        <p style="margin: 0 0 25px 0;">Unfortunately, your request to claim ownership of the business listing <strong>${request.businessName}</strong> could not be verified and has been <strong>Rejected</strong> by the administrator.</p>
                        
                        <p style="margin: 0 0 10px 0; font-weight: bold; color: #1a1a1a;">Reason for Rejection</p>
                        <div style="background-color: #FFF5F5; border-left: 4px solid #D63031; padding: 15px; margin: 15px 0; font-size: 14px; color: #D63031; border-radius: 4px;">
                          ${rejectionReason}
                        </div>
                        
                        <p style="margin: 25px 0 25px 0;">If you believe this was in error, or if you have correct verification documents, please submit a new claim request with updated details.</p>
                        <p style="margin: 0 0 25px 0;">Thank you for choosing Hapmeet.</p>
                      </td>
                    </tr>
                    <!-- Sign-off -->
                    <tr>
                      <td align="left" style="font-size: 14px; color: #4a4a4a; line-height: 1.6; border-top: 1px solid #eeeeee; padding-top: 20px;">
                        Best regards,<br/>
                        <strong>Hapmeet Team</strong>
                      </td>
                    </tr>
                  </table>

                  <!-- Footer -->
                  <table width="600" cellspacing="0" cellpadding="0" style="text-align: center; font-size: 11px; color: #8a8a8a; line-height: 1.6;">
                    <tr>
                      <td style="padding: 0 20px 20px 20px;">
                        Welcome to HappyMilan your hub for finding a life partner, exploring dating opportunities, and making new friends. Join us to connect with a vibrant community and discover meaningful relationships.
                      </td>
                    </tr>
                    <!-- Social Icons -->
                    <tr>
                      <td align="center" style="padding-bottom: 20px;">
                        <table cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="padding: 0 10px;">
                              <a href="https://youtube.com" target="_blank"><img src="https://img.icons8.com/ios-filled/50/8a8a8a/youtube-play.png" width="24" height="24" alt="YouTube" style="display:block; border:0;"/></a>
                            </td>
                            <td style="padding: 0 10px;">
                              <a href="https://facebook.com" target="_blank"><img src="https://img.icons8.com/ios-filled/50/8a8a8a/facebook-new.png" width="24" height="24" alt="Facebook" style="display:block; border:0;"/></a>
                            </td>
                            <td style="padding: 0 10px;">
                              <a href="https://instagram.com" target="_blank"><img src="https://img.icons8.com/ios-filled/50/8a8a8a/instagram-new.png" width="24" height="24" alt="Instagram" style="display:block; border:0;"/></a>
                            </td>
                            <td style="padding: 0 10px;">
                              <a href="https://twitter.com" target="_blank"><img src="https://img.icons8.com/ios-filled/50/8a8a8a/twitter.png" width="24" height="24" alt="Twitter" style="display:block; border:0;"/></a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <!-- Unsubscribe -->
                    <tr>
                      <td style="font-size: 10px; color: #8a8a8a; padding-bottom: 20px;">
                        If you prefer not to receive these emails in the future, please <a href="https://hapmeet.com/unsubscribe" target="_blank" style="color: #6C5CE7; text-decoration: none;">unsubscribe here</a>.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });
    } catch (err) {
      console.error('Failed to send claim rejection email:', err);
    }
  }

  res.status(httpStatus.OK).send({
    message: `Claim request has been successfully ${status}.`,
    results: request,
  });
});
