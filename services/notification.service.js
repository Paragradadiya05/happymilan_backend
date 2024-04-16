import admin from 'firebase-admin';

// TODO: uncomment this line and create FirebaseJson
const serviceAccount = require('../config/firebase.json');

/**
 * intializing the firebase messaging service (push notification)
 */
const messaging = admin
  .initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
  .messaging();
/* eslint-disable */
export const verifyFCMToken = async (fcmToken) => {
  try {
    const isValid = await messaging.send(
      {
        token: fcmToken,
      },
      false
    );
    return isValid;
  } catch (er) {}
};

/* eslint-enable */
/**
 * Send an Notification
 * @param {string || string[]} deviceToken
 * @param {Object} message
 * @param {string} options
 * @returns {Promise}
 */
// export const sendNotification = async (deviceToken, message) => {
//   try {
//     console.log('===sendNotification deviceToken ===>', deviceToken);
//     console.log('=== sendNotification message ===>', message);
//     const result = await messaging.sendToDevice(deviceToken, message, {
//       priority: 'high',
//       timeToLive: 0,
//       ttl: 0,
//     });
//     console.log('=== sendNotification result ===>', result);
//     return result;
//   } catch (e) {
//     console.log('=== sendNotification error ===>', e);
//   }
// };

export const sendNotification = async (fcmToken, messageData) => {
  try {
    const message = {
      notification: {
        ...(messageData.data._id && { _id: messageData.data._id }),
        ...(messageData.data.userId && { _id: messageData.data.userId }),
        ...(messageData.data.body && { _id: messageData.data._id }),
        ...(messageData.data.title && { _id: messageData.data.body }),
      },
    };
    messaging
      .sendToDevice(
        fcmToken,
        {
          notification: {
            title: messageData.data.body,
            ...(messageData.data.body && { jsonData: JSON.stringify(message) }),
          },
        },
        {
          priority: 'high',
          timeToLive: 0,
          ttl: 0,
          // dryRun: true,
        }
      )
      .then((res) => {
        if (!res.successCount) {
          console.log('error in send notification ===>', res.results);
        }
      })
      .catch((e) => {
        console.log('=== error in send notification outside fun ===>', e);
      });
  } catch (er) {
    console.log('=== error in send notification outside fun catch ===>', er);
  }
};
