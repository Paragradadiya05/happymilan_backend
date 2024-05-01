import socketIO from 'socket.io';
import httpStatus from 'http-status';
import { messageservice, userService } from '../services';
import ApiError from '../utils/ApiError';
import { uploadChatContent } from '../services/s3.service';
import { EnumOfChatType } from '../models/enum.model';

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

  socket.on('uploadContent', async (data) => {
    try {
      const { from, to, message, type, fileName } = data;
      if (!from || !to || !message || !type) {
        throw new Error('');
      }

      const getUserToSendMessage = await userService.getOne({ _id: to });
      if (!getUserToSendMessage) {
        throw new ApiError(httpStatus.NOT_FOUND, 'user not fount, please login back');
      }

      const result = await uploadChatContent(type, fileName, from);
      const createMessageBody = {
        from,
        to,
        message,
        fileUrl: result.url.split('?')[0],
        sendAt: Date.now(),
        type,
      };
      await messageservice.createMessage(createMessageBody);

      socket.emit('message', {
        from,
        to,
        data: {
          message: 'file upload url generated',
          result,
        },
      });

      console.log('=== var name ===> after emit events ');
    } catch (e) {
      // todo: handle error here in socket
      console.log('=== var uploadContent error ===>', e);
    }
  });

  // send msg on event => event call from front end side
  socket.on('sendMessage', async (data) => {
    // from : => login user
    // to: => receiver message user
    // message : => message that sent from user
    try {
      const { from, to, message, page, limit, type } = data;
      if (!from || !to || !message) {
        throw new Error('');
      }
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
        ...(type && { type }),
      };
      // here we need to check if type is image or video then a message is already created so not need to send it again to another user
      if (type && [EnumOfChatType.IMAGE, EnumOfChatType.VIDEO, EnumOfChatType.DOC].includes(type)) {
        // Do nothing because it's one of the specified types
      } else {
        console.log('=== var type is to create message ===>');
        await messageservice.createMessage(createMessageBody);
      }
      // await messageservice.createMessage(createMessageBody);
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
        // sendMessage,
        data: {
          message: 'messages received',
          sendMessage,
        },
      });
      socket.to(to).emit('message', {
        from,
        to,
        // sendMessage,
        data: {
          message: 'messages received',
          sendMessage,
        },
      });
    } catch (e) {
      console.log('=== error from socket  ===>', e);
    }
  });

  socket.on('readMessage', async (data) => {
    try {
      const { messageId, from, to } = data;
      if (!messageId || !from || !to) {
        throw new Error('Message ID, sender, and receiver are required');
      }
      // Update the message to mark as read
      const updatedMessage = await messageservice.updateMessage({ _id: messageId }, { isReadMessage: true }, { new: true });

      // Get all messages sent before the current message
      const earlierMessages = await messageservice.getMessageList({
        from,
        to,
        sendAt: { $lt: updatedMessage.sendAt }, // Find messages sent before the current message
      });

      // Update all earlier messages to mark them as read
      await Promise.all(
        earlierMessages.map(async (message) => {
          await messageservice.updateMessage({ _id: message.id }, { isReadMessage: true });
        })
      );

      // Emit confirmation back to sender
      socket.emit('message', {
        from,
        to,
        updatedMessage,
        data: {
          message: 'messages received',
          updatedMessage,
        },
      });
      // Emit event to the receiver's socket
      socket.to(to).emit('message', {
        from,
        to,
        updatedMessage,
        data: {
          message: 'messages received',
          updatedMessage,
        },
      });
    } catch (e) {
      // Handle errors
      console.error('Error marking message as read:', e.message);
      socket.emit('messageReadConfirmation', {
        success: false,
        message: e.message,
      });
    }
  });

  socket.on('DeleteMessage', async (data) => {
    try {
      const { messageId, from, to, messageDeletedFrom, messageDeletedTo, messageDeletedAll } = data;
      if (!messageId || !from || !to) {
        throw new Error('Message ID, sender, receiver required');
      }

      // Update the message's 'messageDeletedFrom' and 'messageDeletedTo' fields based on the provided values
      await messageservice.updateMessage(
        { _id: messageId, from, to },
        {
          ...(messageDeletedFrom && { messageDeletedFrom }),
          ...(messageDeletedTo && { messageDeletedTo }),
          ...(messageDeletedAll && { messageDeletedAll }),
        },
        { new: true }
      );

      socket.emit('message', {
        data: {
          status: true,
          message: 'Message deletion status updated successfully',
        },
      });
    } catch (e) {
      // Handle errors
      console.error('Error updating message deletion status:', e.message);
      socket.emit('messageDeleteStatusUpdateConfirmation', {
        success: false,
        message: e.message,
      });
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

      sendMessage.results = sendMessage.results.filter(
        (item) => item.from.toString() === socket.user.toString() && !item.messageDeletedFrom && !item.messageDeletedAll
      );
      socket.emit('message', {
        from,
        to,
        data: {
          message: 'messages received',
          sendMessage,
        },
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

socketAPI.io = io;
module.exports = socketAPI;
