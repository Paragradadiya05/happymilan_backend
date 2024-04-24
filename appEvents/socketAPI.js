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
  // Connection now authenticated to receive further events
  socket.on('message', function (message) {
    io.emit('message', message);
  });
  // send msg on event => event call from front end side
  socket.on('sendMessage', async (data) => {
    // from : => login user
    // to: => receiver message user
    // message : => message that sent from user
    try {
      const { from, to, message, page, limit } = data;
      const getUserToSendMessage = await userService.getOne({ _id: to });
      if (!getUserToSendMessage) {
        throw new ApiError(httpStatus.NOT_FOUND, 'user not fount, please login back');
      }
      // create message
      const createMessageBody = {
        from,
        to,
        message,
        sendAt: Date.now(),
      };
      await messageservice.createMessage(createMessageBody);
      const options = {
        page: page || 1,
        limit: limit || 15,
        sort: { sendAt: -1 }, // Default limit to 10 if not specified
      };
      const sendMessage = await messageservice.getMessageWithPagination(
        {
          from,
          to: { $in: [getUserToSendMessage._id] },
        },
        options
      );

      socket.emit('message', {
        from,
        to,
        sendMessage,
      });

      socket.to(to).emit('message', {
        from,
        to,
        sendMessage,
      });
    } catch (e) {
      console.log('=== error from socket  ===>', e);
    }
  });

  socket.on('typing', (data) => {
    // Broadcast "typing" event to other users
    socket.broadcast.emit('typing', data);
  });

  // Listen for "stopTyping" event
  socket.on('stopTyping', (data) => {
    // Broadcast "stopTyping" event to other users
    socket.broadcast.emit('stopTyping', data);
  });

  socket.on('getLastConversation', async (data) => {
    try {
      const { from, to, page, limit } = data;
      const getUserToSendMessage = await userService.getOne({ _id: to });
      if (!getUserToSendMessage) {
        throw new ApiError(httpStatus.NOT_FOUND, 'user not fount, please login back');
      }

      const sendMessage = await messageservice.getMessageWithPagination(
        {
          from,
          to: { $in: [getUserToSendMessage._id] },
        },
        {
          page: page || 1,
          limit: limit || 15,
          sort: { sendAt: -1 }, // Default limit to 10 if not specified
        }
      );

      socket.emit('message', {
        from,
        to,
        sendMessage,
      });

      // socket.to(to).emit('message', {
      //   from,
      //   to,
      //   sendMessage,
      // });
    } catch (e) {
      console.log('=== error from get last conversation ===>', e);
    }
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
