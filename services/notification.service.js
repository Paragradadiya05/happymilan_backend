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
 * @param {string || string[]} fcmToken
 * @param {Object} messageData
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
      token: fcmToken,
      notification: {
        title: messageData.data.title,
        body: messageData.data.body,
      },
      data: {
        _id: messageData.data._id || '',
        userId: messageData.data.userId || '',
        ...messageData.data,
      },
    };

    messaging
      .send(message)
      .then((res) => {
        console.log('Successfully sent message:', res);
      })
      .catch((error) => {
        console.log('Error sending message:', error);
        // todo : error handling db ( model => userid => store error )\
        if (error.code === 'messaging/registration-token-not-registered') {
          console.error(`Token not registered: ${fcmToken}`);
        }
      });

    // messaging
    //   .sendToDevice(
    //     fcmToken,
    //     {
    //       notification: {
    //         title: messageData.data.body,
    //         ...(messageData.data.body && { jsonData: JSON.stringify(message) }),
    //       },
    //     },
    //     {
    //       priority: 'high',
    //       timeToLive: 0,
    //       ttl: 0,
    //       // dryRun: true,
    //     }
    //   )
    //   .then((res) => {
    //     if (!res.successCount) {
    //       console.log('error in send notification ===>', res.results);
    //     }
    //   })
    //   .catch((e) => {
    //     console.log('=== error in send notification outside fun ===>', e);
    //   });
  } catch (er) {
    console.log('=== error in send notification outside fun catch ===>', er);
  }
  messaging
    .getToken({ vapidKey: 'BFYnbnwgg04Sn4hAgvSN4y1x-NYEclY52q99ag4B3iooUlDnigLjIYBolQwWB6S8U8Xmq7B_JWU6qk8TaECk_Y8' })
    .then((currentToken) => {
      if (currentToken) {
        console.log('New FCM token:', currentToken);
        // Send the token to your server for notifications
      } else {
        console.log('No registration token available.');
      }
    })
    .catch((err) => {
      console.error('An error occurred while retrieving token:', err);
    });
};
