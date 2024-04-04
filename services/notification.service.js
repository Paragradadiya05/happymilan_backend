import admin from 'firebase-admin';

// TODO: uncomment this line and create FirebaseJson
const serviceAccount = require('../config/firebase.json');

const notificationOptions = {
  priority: 'high',
};
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
      true
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
export const sendNotification = async (deviceToken, message, options = {}) => {
  try {
    console.log('=== var message ===>', message);

    return messaging.sendToDevice(deviceToken, message, { ...notificationOptions, ...options });
  } catch (e) {
    console.log('=== var name ===>', e);
  }
};

// export const sendNotification = async (deviceToken, message, options = {}) => {
//   try {
//     const payload = {
//       notification: {
//         title: 'Urgent action needed!',
//         body: 'Urgent action is needed to prevent your account from being disabled!',
//       },
//     };
//
//     messaging
//       .sendToDevice(deviceToken, message, { ...notificationOptions, ...options })
//       .then((response) => {
//         console.log('Successfully sent message:', response);
//       })
//       .catch((error) => {
//         console.log('Error sending message:', error);
//       });
//   } catch (e) {
//     console.log('=== var name ===>', e);
//   }
// };
