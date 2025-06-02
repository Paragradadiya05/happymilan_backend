import socketIO from 'socket.io';
import httpStatus from 'http-status';
import { friendService, messageservice, userService } from '../services';
import ApiError from '../utils/ApiError';
import { uploadChatContent } from '../services/s3.service';
import { EnumOfChatType, EnumStatusOfFriend } from '../models/enum.model';
import { Like, Message, User } from '../models';
import { MessageCountForUser } from '../services/message.service';

// eslint-disable-next-line import/no-extraneous-dependencies
const { ObjectId } = require('mongodb');

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
      const { from, to, message, type, fileName, replyMessageId } = data;
      if (!from || !to || !type) {
        throw new Error('');
      }

      // if a message is reply message, then we have to add a message id of replayed a message in body of the same message and give a flag to that.
      if (replyMessageId) {
        if (!ObjectId.isValid(replyMessageId)) {
          const validateMessageAvailableOrNot = await messageservice.findMessageById(replyMessageId);
          if (!validateMessageAvailableOrNot) {
            socket.emit('message', {
              from,
              to,
              // sendMessage,
              data: {
                success: false,
                message: 'Add valid reply message id',
              },
            });
          }
        }
      }

      const getUserToSendMessage = await userService.getOne({ _id: to });
      if (!getUserToSendMessage) {
        throw new ApiError(httpStatus.NOT_FOUND, 'user not fount, please login back');
      }

      const result = await uploadChatContent(type, fileName, from);
      const createMessageBody = {
        from,
        to,
        message: message || '',
        fileUrl: result.url.split('?')[0],
        sendAt: Date.now(),
        type,
        ...(replyMessageId && { replyMessageId, isMessageReply: true }),
      };
      const chatMessage = await messageservice.createMessage(createMessageBody);

      socket.emit('message', {
        from,
        to,
        data: {
          message: 'file upload url generated',
          result,
          chatMessage,
        },
      });

      console.log('=== var name ===> after emit events '); // todo : add logger in file and store error in model ( for better error handling )
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
      const { from, to, message, page, limit, type, messageId, replyMessageId } = data;
      if (!from || !to || (!message && !type)) {
        throw new Error('');
      }

      // if a message is reply message then we have to add a message id of replayed message in body of the same message and give a flag to that.
      if (replyMessageId) {
        if (!ObjectId.isValid(replyMessageId)) {
          const validateMessageAvailableOrNot = await messageservice.findMessageById(replyMessageId);
          if (!validateMessageAvailableOrNot) {
            socket.emit('message', {
              from,
              to,
              // sendMessage,
              data: {
                success: false,
                message: 'Add valid reply message id',
              },
            });
          }
        }
      }

      const getUserToSendMessage = await userService.getOne({ _id: to });
      if (!getUserToSendMessage) {
        throw new ApiError(httpStatus.NOT_FOUND, 'user not fount, please login back');
      }
      // create message
      const createMessageBody = {
        from,
        to,
        message: message || '',
        sendAt: Date.now(),
        ...(type && { type }),
        ...(replyMessageId && { replyMessageId, isMessageReply: true }),
      };
      // here we need to check if type is image or video then a message is already created so not need to send it again to another user
      if (type && [EnumOfChatType.IMAGE, EnumOfChatType.VIDEO, EnumOfChatType.DOC, EnumOfChatType.AUDIO].includes(type)) {
        // Do nothing because it's one of the specified types
        if (messageId) {
          await messageservice.updateMessage(
            {
              _id: messageId,
            },
            {
              isFileUploaded: true,
            },
            {
              new: true,
            }
          );
        }
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

      // eslint-disable-next-line
      sendMessage.results = sendMessage.results.filter((item) => {
        if (item.from.toString() !== socket.user.toString() && !item.messageDeletedAll) {
          return item;
        }
        if (item.from.toString() === socket.user.toString()) {
          if (!item.messageDeletedAll) {
            if (!item.messageDeletedFrom) {
              return item;
            }
            // not return message
          } else {
            // not return message
          }
        }
      });

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

  socket.on('getCountOfUnReadMessageForUser', async () => {
    const getUnreadMessageCount = await messageservice.getUnreadMessageCountForUser(socket.user);
    socket.emit('unreadMessageCount', {
      userId: socket.user,
      data: {
        message: 'getting unread message count',
        success: true,
        getUnreadMessageCount,
      },
    });
  });

  socket.on('DeleteMessage', async (data) => {
    try {
      const { messageId, from, to, messageDeletedFrom, messageDeletedTo, messageDeletedAll } = data;
      if (!messageId || !from || !to) {
        throw new Error('Message ID, sender, receiver required');
      }

      // Update message deletion flags in the database
      await messageservice.updateMessage(
        { _id: messageId, from, to },
        {
          ...(messageDeletedFrom && { messageDeletedFrom }),
          ...(messageDeletedTo && { messageDeletedTo }),
          ...(messageDeletedAll && { messageDeletedAll }),
        },
        { new: true }
      );

      // Notify the sender
      socket.emit('message', {
        success: true,
        message: 'Message deletion status updated successfully',
        messageId,
      });

      // If message should be deleted for both, notify the recipient as well
      if (messageDeletedAll) {
        // Emit to recipient's socket
        socket.to(to).emit('messageDeleted', {
          messageId,
          deletedFor: 'both',
        });
      }
    } catch (e) {
      console.error('Error updating message deletion status:', e.message);
      socket.emit('messageDeleteStatusUpdateConfirmation', {
        success: false,
        message: e.message,
      });
    }
  });

  socket.on('DeleteChat', async (data) => {
    try {
      const { from, to, deleteChet } = data;

      if (!from || !to || deleteChet !== true) {
        throw new Error('Both sender and receiver IDs and deleteChet flag are required');
      }

      // Update all messages between these users in both directions
      const result = await messageservice.updateManyMessages(
        {
          $or: [
            { from, to },
            { from: to, to: from },
          ],
        },
        {
          messageDeletedAll: true,
          deleteChet: true,
        }
      );

      // Notify sender
      socket.emit('message', {
        success: true,
        message: 'Chat deleted successfully for both users',
        from,
        to,
        count: result.modifiedCount || 0,
      });

      // Notify receiver
      socket.to(to).emit('chatDeleted', {
        from,
        to,
        deletedFor: 'both',
      });
    } catch (err) {
      console.error('Error deleting chat:', err.message);
      socket.emit('chatDeleteError', {
        success: false,
        message: err.message,
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
          limit: limit || 100,
          sort: { sendAt: -1 }, // Default limit to 10 if not specified
        }
      );

      // sendMessage.results = sendMessage.results.filter(
      //   (item) => item.from.toString() === socket.user.toString() && !item.messageDeletedFrom && !item.messageDeletedAll
      // );

      // eslint-disable-next-line
      sendMessage.results = sendMessage.results.filter((item) => {
        if (item.from.toString() !== socket.user.toString() && !item.messageDeletedAll) {
          return item;
        }
        if (item.from.toString() === socket.user.toString()) {
          if (!item.messageDeletedAll) {
            if (!item.messageDeletedFrom) {
              return item;
            }
            // not return message
          } else {
            // not return message
          }
        }
      });

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

  socket.on('createUserLike', async (data) => {
    // get event when someone like profile
    try {
      // Assuming 'data' contains necessary information like user IDs or profile IDs
      const { userId, page, limit, likedUserId } = data; // Assuming userId is available in 'data'
      // Assuming likedUserId is available in 'data'

      const likedUser = await User.findById(likedUserId);
      if (!likedUser) {
        throw new Error('No such user exists');
      }

      const existingLike = await Like.findOne({ user: userId, likedUserId });

      if (existingLike) {
        if (existingLike.isLike) {
          socket.emit('message', {
            data: {
              status: false,
              message: 'Failed to create like',
              // You can send additional data if needed
            },
          });
          return;
        }
        existingLike.isLike = true;
        existingLike.updatedBy = userId;
        existingLike.statusHistory.push({
          isLike: true,
          date: new Date(),
        });
        await existingLike.save();
      } else {
        const statusHistory = {
          isLike: true,
          date: new Date(),
        };
        await Like.create({
          user: userId,
          likedUserId,
          isLike: true,
          statusHistory: [statusHistory],
          createdBy: userId,
          updatedBy: userId,
        });
      }

      const message = await Like.paginate(
        { user: userId, isLike: true },
        {
          page: page || 1,
          limit: limit || 15,
        }
      );

      socket.emit('message', {
        data: {
          status: true,
          message: 'profile liked',
          data: message,
        },
      });
      socket.to(likedUserId).emit('message', {
        data: {
          status: true,
          message: 'some one like your profile',
          data: message,
        },
      });
      // after get like event update db with event and send to fe side one event
    } catch (error) {
      // Handle errors
      console.error(error);
      socket.emit('message', {
        data: {
          status: false,
          message: error.message || 'Failed to create like',
          // You can send additional data if needed
        },
      });
    }
  });

  socket.on('updateUserLike', async (data) => {
    try {
      const { userId, page, limit, likedUserId, isLike } = data;

      // Find the existing like
      const existingLike = await Like.findOne({ user: userId, likedUserId });

      if (!existingLike) {
        throw new Error('No existing like found');
      }

      // Update the like status
      existingLike.isLike = isLike;
      existingLike.updatedBy = userId;
      existingLike.statusHistory.push({
        isLike,
        date: new Date(),
      });

      // Save the updated like
      await existingLike.save();
      const message = await Like.paginate(
        { user: userId, isLike: true },
        {
          page: page || 1,
          limit: limit || 15,
        }
      );

      socket.emit('message', {
        data: {
          status: true,
          message: 'update liked',
          data: message,
        },
      });
      socket.to(likedUserId).emit('message', {
        data: {
          status: true,
          message: 'update liked',
          data: message,
        },
      });
      // Emit a message to the user who initiated the update
      socket.emit('message', {
        data: {
          status: true,
          message: 'Like updated successfully',
          updatedLike: existingLike,
        },
      });
    } catch (error) {
      // Handle errors
      console.error(error);
      socket.emit('message', {
        data: {
          status: false,
          message: error.message || 'Failed to update like',
        },
      });
    }
  });

  socket.on('userActive', async () => {
    try {
      // add user status in user model
      const userId = socket.user;
      // TODO : make event for this, so we can update it from login and logout time also
      await userService.updateUser({ _id: userId }, { isUserActive: true });

      socket.emit('onlineUser', {
        data: {
          success: true,
          message: 'user online',
        },
      });
    } catch (e) {
      socket.emit('onlineUser', {
        data: {
          success: false,
          message: 'user online',
          error: e,
        },
      });
    }
    // add event while user comes onlie (from mobile or web)
    // when user gets offline at that time hit socket and makes inactive status in user data
  });

  socket.on('MessagesOfFriends', async (data) => {
    try {
      const userId = socket.user;
      if (!userId) throw new Error('User not authenticated in socket');

      const options = {
        page: data.page || 1,
        limit: data.limit || 100,
      };

      const filter = {
        status: EnumStatusOfFriend.ACCEPTED,
        $or: [{ friend: userId }, { user: userId }],
      };

      const friendsListResult = await friendService.getFriendAcceptedMobile(filter, options, userId);
      const friendsList = (friendsListResult && friendsListResult.results) || [];

      const unreadResults = await MessageCountForUser(userId, { limit: 1000, page: 1 });

      const unreadMap = new Map();
      if (
        Array.isArray(unreadResults) &&
        unreadResults.length > 0 &&
        unreadResults[0] &&
        Array.isArray(unreadResults[0].data)
      ) {
        unreadResults[0].data.forEach((item) => {
          unreadMap.set(item._id.toString(), item.unreadMessageCount);
        });
      }

      let lastMessages = await Promise.all(
        friendsList.map(async (friendDoc) => {
          try {
            const friendObj = friendDoc._doc || friendDoc;
            const friendUser = friendObj.friend;
            const mainUser = friendObj.user;

            if (!friendUser || !friendUser._id || !mainUser || !mainUser._id) {
              return null;
            }

            const friendId =
              friendUser._id.toString() === userId.toString() ? mainUser._id.toString() : friendUser._id.toString();

            const rawFriend = friendUser._id.toString() === userId.toString() ? mainUser : friendUser;
            const rawUser = friendUser._id.toString() === userId.toString() ? friendUser : mainUser;

            if (!ObjectId.isValid(userId) || !ObjectId.isValid(friendId)) {
              console.warn('Invalid ObjectId for user or friend');
              return null;
            }

            const query = {
              $or: [
                { from: new ObjectId(userId), to: new ObjectId(friendId) },
                { from: new ObjectId(friendId), to: new ObjectId(userId) },
              ],
              messageDeletedAll: { $ne: true }, // ✅ Exclude deleted-for-all messages
            };

            const lastMessage = await Message.findOne(query)
              .sort({ sendAt: -1 }) // Get latest message
              .lean();

            const unreadCount = unreadMap.get(friendId) || 0;

            const selectFields = ({ _id, name, firstName, lastName, profilePic, isUserActive }) => ({
              _id,
              name,
              firstName,
              lastName,
              profilePic,
              isUserActive,
            });

            return {
              lastMessage: lastMessage || null,
              unreadCount,
              friendList: selectFields(rawFriend),
              userList: selectFields(rawUser),
            };
          } catch (err) {
            console.error('Error processing friend:', err);
            return null;
          }
        })
      );

      lastMessages = lastMessages
        .filter((item) => item)
        .sort((a, b) => {
          const dateA = new Date((a.lastMessage && a.lastMessage.sendAt) || 0);
          const dateB = new Date((b.lastMessage && b.lastMessage.sendAt) || 0);
          return dateB - dateA;
        });

      socket.emit('MessagesOfFriends', {
        success: true,
        data: lastMessages,
      });
    } catch (error) {
      console.error('Error in getLastMessagesOfFriends:', error);
      socket.emit('lastMessagesOfFriends', {
        success: false,
        message: error.message || 'Something went wrong',
      });
    }
  });

  socket.on('userInActive', async () => {
    try {
      // add user status in user model
      const userId = socket.user;
      // TODO : make an event for this, so we can update it from login and logout time also
      await userService.updateUser({ _id: userId }, { isUserActive: false });

      socket.emit('onlineUser', {
        data: {
          success: true,
          message: 'user offline',
        },
      });
    } catch (e) {
      socket.emit('onlineUser', {
        data: {
          success: false,
          message: 'user offline',
          error: e,
        },
      });
    }
  });
});

socketAPI.io = io;
module.exports = socketAPI;
