import socketIO from 'socket.io';
import httpStatus from 'http-status';
import { messageservice, userService } from '../services';
import ApiError from '../utils/ApiError';

const { initSubscription } = require('./subscriptions');

const io = socketIO();
const socketAPI = {};
const onlineUsers = new Set();

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
    const { from, to, message } = data;
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

    const sendMessage = await messageservice.getMessageList({
      from,
      to: { $in: [getUserToSendMessage._id] },
    });
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
  });
  socket.on('typing', (data) => {
    // Broadcast "typing" event to other users
    socket.broadcast.emit('typing', data);
  });

  // Listen for "stopTyping" event
  socket.on('stopTyping', () => {
    // Broadcast "stopTyping" event to other users
    socket.broadcast.emit('stopTyping');
  });

  socket.on('checkUserStatus', async (data, callback) => {
    const { userId } = data;
    try {
      // Check if the user exists
      const user = await userService.getOne({ _id: userId });
      if (!user) {
        // If user does not exist, send an error response
        callback({ error: 'User not found' });
        return;
      }

      // Check if the user is online
      const isOnline = onlineUsers.has(userId);
      callback({ userId, isOnline }); // Emitting the online status back to the client
    } catch (error) {
      // Handle any errors
      callback({ error: 'Internal server error' });
    }
  });

  // Handling user connections and disconnections
  socket.on('disconnect', () => {
    const { userId } = socket;
    if (userId) {
      onlineUsers.delete(userId); // Remove user from online users set when they disconnect
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
