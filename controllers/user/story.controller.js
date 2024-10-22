import httpStatus from 'http-status';
import { storyService, tokenService } from 'services';
import { catchAsync } from 'utils/catchAsync';
import { sendEmailForStoryConsentTaken } from '../../services/email.service';
import { User } from '../../models';
import { pick } from '../../utils/pick';

export const create = catchAsync(async (req, res) => {
  const { body } = req;
  const userId = req.user._id;
  body.createdBy = req.user;
  body.updatedBy = req.user;
  const options = {};

  const { partnerUserId } = body;

  const partnerUser = await User.findOne({ _id: partnerUserId });
  if (!partnerUser) {
    throw new Error('Partner user not found');
  }

  const story = await storyService.createStory(
    {
      userId,
      ...body,
    },
    options
  );
  const consentToken = await tokenService.generateVerifyStoryConsentToken(userId, story._id);
  await sendEmailForStoryConsentTaken(partnerUser, consentToken);
  console.log('Email sent for consent taken');
  return res.status(httpStatus.CREATED).send({ results: story });
});

export const update = catchAsync(async (req, res) => {
  const { body } = req;
  body.updatedBy = req.user;
  const { storyId } = req.params;
  const filter = {
    _id: storyId,
  };
  const options = { new: true };
  const story = await storyService.updateStory(filter, body, options);
  return res.status(httpStatus.OK).send({ results: story });
});

export const remove = catchAsync(async (req, res) => {
  const { storyId } = req.params;
  const filter = {
    _id: storyId,
  };
  const story = await storyService.removeStory(filter);
  return res.status(httpStatus.OK).send({ results: story });
});

export const list = catchAsync(async (req, res) => {
  const { query } = req;
  const sortingObj = pick(query, ['sort', 'order']);
  const sortObj = {
    [sortingObj.sort]: sortingObj.order,
  };
  const filter = {
    isConsentTaken: true,
  };
  const options = {
    sort: sortObj,
    ...pick(query, ['limit', 'page']),
    lean: true,
  };
  const story = await storyService.getStoryWithPagination(filter, options);
  return res.status(httpStatus.OK).send({ results: story });
});

export const verifyStoryConsent = catchAsync(async (req, res) => {
  try {
    await storyService.verifyConsent(req.query);

    // HTML response
    const htmlResponse = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              background-color: #f4f4f9;
            }
            .container {
              background-color: #ffffff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              text-align: center;
            }
            h1 {
              color: #6c90ee;
              font-size: 24px;
              margin-bottom: 10px;
            }
            p {
              font-size: 18px;
              color: #333;
            }
            .button {
              display: inline-block;
              padding: 10px 20px;
              background-color: #013c93;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 20px;
              font-size: 16px;
            }
            .button:hover {
              background-color: #27418c;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Your Story Consent is Verified Successfully</h1>
            <p>Thank you for verifying your consent. Your story consent process is now complete.</p>
            <a href="/" class="button">Go to Home</a>
          </div>
        </body>
      </html>
    `;

    res.status(httpStatus.OK).send(htmlResponse);
  } catch (e) {
    res.status(httpStatus.OK).send({ message: e.message });
  }
});
