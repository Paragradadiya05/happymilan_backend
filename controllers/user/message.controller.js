import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { messageservice } from '../../services';

export const createMessage = catchAsync(async (req, res) => {
  const options = {};
  const message = await messageservice.createMessage(req.body, options);
  return res.status(httpStatus.OK).send({ results: message });
});

export const getMessage = catchAsync(async (req, res) => {
  const { loginUser, otherUser } = req.body;
  const filter = {
    from: { $in: [loginUser, otherUser] },
    to: { $in: [loginUser, otherUser] },
    messageDeletedAll: false,
  };
  const options = { sort: 'createdAt', limit: 5 };
  const message = await messageservice.getMessageList(filter, options);
  return res.status(httpStatus.OK).send({ results: message });
});

export const getMessagePaginated = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { page, limit } = req.query;
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 15);
  const filter = {
    user: userId,
  };
  const options = {
    page: pageNumber,
    limit: limitNumber,
  };
  const message = await messageservice.getMessageWithPagination(filter, options);
  return res.status(httpStatus.OK).send({ results: message });
});
