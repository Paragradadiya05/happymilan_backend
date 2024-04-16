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
      data: {
        _id: messageData.data._id,
        userId: messageData.data.userId,
        otherUserId: messageData.data.otherUserId,
        body: messageData.data.body,
      },
    };

    messaging
      .sendToDevice(fcmToken, message, {
        priority: 'high',
        timeToLive: 0,
        ttl: 0,
      })
      .then((res) => {
        console.log('=== var name ===>', res.results);
      })
      .catch((e) => {
        console.log('=== var error ===>', e);
      });
  } catch (er) {
    console.log('=== var eer ===>', er);
  }
};
