import { Message, User, Notification } from 'models';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { sendNotification } from './notification.service';

export async function createMessage(body = {}) {
  const message = await Message.create(body);

  const fromUserId = body.from.toString();
  const toUserId = body.to.toString();

  // Get sender and recipient details
  const fromUser = await User.findById(fromUserId);
  const toUser = await User.findById(toUserId);

  if (!toUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Recipient does not exist');
  }

  if (!toUser.isUserActive) {
    // Create notification for the recipient (to) if they are offline
    const notificationForRecipient = await Notification.create({
      userId: toUserId,
      otherUserId: fromUserId,
      body: `Message received from ${fromUser.name}`,
    });

    // Send notification to recipient (to) if they are offline
    if (toUser.deviceTokens.length) {
      await toUser.deviceTokens.map(async (fcmToken) => {
        await sendNotification(fcmToken.deviceToken, {
          data: {
            _id: notificationForRecipient._id.toString(),
            userId: toUserId,
            otherUserId: fromUserId,
            body: `Message received from ${fromUser.name}`,
            title: 'Message Received',
          },
        });
      });
    }
  }

  return message;
}
export async function getMessageList(filter, options = {}) {
  const message = await Message.find(filter, options.projection, options).sort({ createdAt: -1 }).limit(5);
  return message;
}
export async function getMessageWithPagination(filter, options = {}) {
  const message = await Message.paginate(filter, options);
  return message;
}

export async function updateMessage(filter, body, options = {}) {
  const message = await Message.findOneAndUpdate(filter, body, options);
  return message;
}

export async function findMessageById(messageId, options = {}) {
  const message = await Message.findById(messageId, options);
  return message;
}

// eslint-disable-next-line no-unused-vars
export async function getUnreadMessageCountForUser(userId, options = {}) {
  const { limit = 10, page = 1 } = options;
  const pipeline = [
    {
      $match: {
        to: userId,
        isReadMessage: false,
      },
    },
    {
      $group: {
        _id: '$from',
        unreadMessageCount: { $sum: 1 },
      },
    },
    {
      $facet: {
        metadata: [{ $count: 'total' }, { $addFields: { page } }],
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
      },
    },
  ];
  const getMessage = await Message.aggregate(pipeline).exec();
  return getMessage;
}
