import { Message } from 'models';

export async function createMessage(body = {}) {
  const message = await Message.create(body);
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
