import socketIO from 'socket.io';
import httpStatus from 'http-status';
import { messageservice, userService } from '../services';
import ApiError from '../utils/ApiError';

const { initSubscription } = require('./subscriptions');

const io = socketIO();
const socketAPI = {};
/**
 * This is used for the Authentication purpose and this can be added the conditionally
 */
io.use(initSubscription).on('connection', function (socket) {
  // console.log('=== var socket ===>', socket);
  // Connection now authenticated to receive further events
  socket.on('message', function (message) {
    io.emit('message', message);
  });
  // send msg on event => event call from front end side
  socket.on('sendMessage', async (data) => {
    const { from, to } = data;
    const getUserToSendMessage = await userService.getOne({ _id: to });
    if (!getUserToSendMessage) {
      throw new ApiError(httpStatus.NOT_FOUND, 'user not fount, please login back');
    }

    // create message
    const createMessageBody = {
      from,
      to: getUserToSendMessage._id,
      message: data.message,
      sendAt: Date.now(),
    };
    const result = await messageservice.createMessage(createMessageBody);
    return result;
  });
});

// io.on('connection', function (socket) {
//   console.log('=== var name ===> connection establised');
//
//   // Connection now authenticated to receive further events
//   socket.on('message', function (message) {
//     io.emit('message', message);
//   });
// });

// Your socket logic here
socketAPI.io = io;
module.exports = socketAPI;
