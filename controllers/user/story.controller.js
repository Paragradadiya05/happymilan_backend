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
  <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Story Consent Verified</title>
    <style>
        body {
            font-family: 'Poppins', sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #f9f9f9;
        }

        .logo {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .logo img {
            height: 44px;
            width: 180.13px;
            margin-bottom: 25px;
        }

        .container {
            text-align: center;
            padding: 40px 20px;
            border-radius: 18px;
            position: relative;
            width: 650px;
            height: 355px;
        }

        .container::before {
            content: "";
            position: absolute;
            top: -1px;
            left: -1px;
            right: -1px;
            bottom: -1px;
            background: linear-gradient(90deg, #0F52BA, #8225AF);
            z-index: -1;
            border-radius: 18px;
        }

        .container::after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: white;
            z-index: -1;
            border-radius: 18px;
        }

        .icon {
            margin-top: 20px;
        }

        .icon img {
            width: 41.25px;
            height: 41.25px;
        }

        .message {
            font-size: 20px;
            font-weight: 600;
            margin-top: 20px;
            line-height: 30px;
        }

        .sub-message {
            font-size: 16px;
            line-height: 24px;
            margin-top: 25px;
            font-weight: 400;
        }

        .button {
           margin-top: 50px;
            display: inline-block;
            width: 142px;
            height: 50px;
            font-size: 16px;
            color: white;
            text-align: center;
            line-height: 50px; /* Aligns text vertically */
            text-decoration: none;
            background: linear-gradient(90deg, #0F52BA, #8225AF);
            border: none;
            border-radius: 25px; /* Half of the height for perfect rounding */
            font-weight: 600;
            box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
        }

        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0px 6px 8px rgba(0, 0, 0, 0.2);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            .container {
                width: 90%;
                height: auto; /* Allow flexible height for smaller screens */
                padding: 30px 15px;
            }

            .logo img {
                height: 40px;
                width: auto;
            }

            .icon img {
                width: 36px;
                height: 36px;
            }

            .message {
                font-size: 18px;
                line-height: 28px;
            }

            .sub-message {
                font-size: 14px;
                line-height: 22px;
            }

            .button {
                width: 130px;
                height: 45px;
                font-size: 14px;
                line-height: 45px;
            }
        }

        @media (max-width: 480px) {
            .container {
                width: 95%;
                padding: 20px;
            }

            .logo img {
                height: 35px;
            }

            .icon img {
                width: 30px;
                height: 30px;
            }

            .message {
                font-size: 16px;
                line-height: 26px;
            }

            .sub-message {
                font-size: 12px;
                line-height: 20px;
            }

            .button {
                width: 120px;
                height: 40px;
                font-size: 12px;
                line-height: 40px;
            }
        }
    </style>
</head>
<body>
    <div class="logo">
        <img src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/users/65e991ad15835e46f0861b8b/65eff3406145b642700c32ba/logo.jpg" alt="Logo">
        <div class="container">
            <div class="icon">
                <img src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/icon/6788d753ce0c2409b6b23132/icon.jpg" alt="Icon">
            </div>
            <div class="message">Your story consent is successfully verified</div>
            <div class="sub-message">
                Thank you for verifying your content. Your story consent process is <br> completed.
            </div>
            <a href="/" class="button">Go to Home</a>
        </div>
    </div>
</body>
</html>

    `;

    res.status(httpStatus.OK).send(htmlResponse);
  } catch (e) {
    res.status(httpStatus.OK).send({ message: e.message });
  }
});

export const get = catchAsync(async (req, res) => {
  const { storyId } = req.params;
  const filter = {
    _id: storyId,
    isConsentTaken: true,
  };
  const options = {};
  const story = await storyService.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: story });
});
