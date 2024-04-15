const admin = require('firebase-admin');

const serviceAccount = require('./config/firebase.json');

// const notificationOptions = {
//   priority: 'high',
//   timeToLive: 0,
//   ttl: 0,
// };

const messaging = admin
  .initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
  .messaging();

console.time('time 1 ');
const verifyFCMToken = async (fcmToken) => {
  const startTime = performance.now();
  console.log('startTime = ', startTime);
  try {
    const message = {
      data: {
        _id: '660e726e5c20aa5195438e3a',
        userId: '660e3690b01d9611db50d3a1',
        otherUserId: '65d5f73d86912f21ed3d78ad',
        body: 'Request received',
        createdAt: 'Thu Apr 04 2024 14:57:10 GMT+0530 (India Standard Time)',
        updatedAt: 'Thu Apr 04 2024 14:57:10 GMT+0530 (India Standard Time)',
      },
    };

    console.time('time 3 ');
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
    // return isValid;

    const endTime = performance.now();
    console.log(`Call to doSomething took ${endTime - startTime} milliseconds`);
  } catch (er) {
    console.log('=== var eer ===>', er);
  }
};

// verifyFCMToken(
//   'eNFwVTjwoj1uIjPitKwcvP:APA91bGOQQC_QEzSagDs3WDl0jt4JTVblMLvbSSiwO-83E-dGK0XmRW94-Wm7lTyL8iCdUwhPytIzN8l0vv4nGpB_c9c4zHNzZm9AWq0QYRD-g-9faNEtftqONBQ02Rwj8lvAuF682wM'
// );

// verifyFCMToken(
//   'cuNM4yomT0EcRAJQFLYK-D:APA91bHBbd0K5heTVV-5oPeNTUvYjQLxZUPzQ7kx7vinfQP9vK6_jfFeaAUF3qRknIbeO5TiNmlTu6m786FUzIf4R1v3SkVu1TeyhVq3Ru67yTm6i8SxseQcVaCxGfoLFgTNJT_zUuV_'
// )

// verifyFCMToken(
//   'eaeIRxs8g783K9v48FlFqu:APA91bGN7iJ0nJdye7newv9U_dFUsKCuLNOQx0FCbHppaFIvxIEPz60AIb1OLnHJOS_UoT4w8JlZk7oQJs4g47xQOPceD_q6v5bauwgtnMGl8aR2OTuS4scg8KY-z_XiQGeAJrMppLXD'
// );

verifyFCMToken([
  'cELZoH8kFd-lxDFGclBebX:APA91bHE_LHmxHcWdvSYWiCGQbhWwPT4mKXlIZwPAyXaMBE9eoBAVnoMpacJuy6NJ_1hqO-09X4sKDRu27heg0qL3MW9NWPiCQLk4ehZ5zUx4-jTFZXUYQyApNlQ8C69OrRoaI7VZmFP',
]);

// OTP
// RESET PASSWORD LINK
// CONGRATULATION FOR REGISTER WITH US
// FESTIVALS WISHES
// NEAR BY MATCHES FOR YOU
// WHEN USER SENT YOUR A REQUEST
// WHEN USER SENT ACCEPT A REQUEST
// USER SEND A MESSAGE WHEN YOU'RE OFFLINE
// CHAT HISTORY
// DAILY MATCHES
// OFFER AND PROMOTION
// WHEN SUCCESSFULLY UPGRADED PLAN
// SUCCESSUL PAYMENTS
// PAYMENT RECEIPTS
// WHEN USER HALFWAY LEAVE THE REGISTER
// WHEN USER HALFWAY LEAVE THE PAYMENT PROCESS

// request sent
// request accepted
// someone like my profile
