// const nodemailer = require('nodemailer');
//
// const mailTransport = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'mntechgroup2@gmail.com',
//     pass: 'krxspszoziqnroer',
//   },
// });
//
// // SMTP_USERNAME=mntechgroup2@gmail.com
// // SMTP_PASSWORD=krxspszoziqnroer
// // EMAIL_FROM=support@happymilan.com
// // FRONT_URL=https://happymilan.tech/api
// const htmlContent = `
//         <html>
//             <style>
//       .box1,
//     </style>
//             <body>
//              <img
//           class="box1"
//           src="https://st3.depositphotos.com/43745012/44906/i/450/depositphotos_449066958-stock-photo-financial-accounting-logo-financial-logo.jpg"
//           alt="company logo"
//         />
//
//                 <h1>Email Verification</h1>
//                 <p>Welcome to parag app!</p>
//                 <p>Thanks for joining us!</p>
//                 <p>Please confirm your email to have access to your dmate account. Paste the code on the site to finish registration.</p>
//                 <p>Your confirmation code:<br> otp </p>
//                 <p>Best regards,<br>The assetpeak Team</p>
//             </body>
//         </html>
//     `;
//
// const details = {
//   from: 'parag.180410107091@gmail.com',
//   to: 'radadiyaparag12989@gmail.com',
//   subject: ' sending first email',
//   html: htmlContent,
// };
//
// mailTransport.sendMail(details, (err) => {
//   if (err) {
//     console.log('error ==== ', err);
//   } else {
//     console.log('email has send === yo ');
//   }
// });
