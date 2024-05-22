import admin from 'firebase-admin';

// Initialize the Firebase Admin SDK
const serviceAccount = require('../config/firebase.json');

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const messaging = app.messaging();

/**
 * Send a notification to a device
 * @param {string|string[]} fcmToken - The FCM token(s) to send the notification to
 * @param {Object} messageData - The message payload to send
 * @returns {Promise}
 */
// eslint-disable-next-line import/prefer-default-export
export const sendNotification = async (fcmToken, messageData) => {
  try {
    const message = {
      notification: {
        ...(messageData.data._id && { _id: messageData.data._id }),
        ...(messageData.data.userId && { userId: messageData.data.userId }),
        ...(messageData.data.body && { body: messageData.data.body }),
        ...(messageData.data.title && { title: messageData.data.title }),
      },
    };

    const response = await messaging.sendToDevice(
      fcmToken,
      {
        notification: {
          title: messageData.data.title,
          body: messageData.data.body,
          ...(messageData.data.body && { jsonData: JSON.stringify(message) }),
        },
      },
      {
        priority: 'high',
        timeToLive: 0,
      }
    );

    // Handle the response to check for invalid tokens
    const tokensToRemove = [];
    response.results.forEach((result, index) => {
      const { error } = result;
      if (error) {
        console.error('Failure sending notification to', fcmToken[index], error);
        // Check for specific error codes to determine if the token should be removed
        if (
          error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
          tokensToRemove.push(fcmToken[index]);
        }
      }
    });

    if (tokensToRemove.length > 0) {
      console.log('Removing invalid tokens:', tokensToRemove);
      // Implement your logic to remove invalid tokens from your database
      // removeInvalidTokensFromDatabase(tokensToRemove);
    }

    return response;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};
