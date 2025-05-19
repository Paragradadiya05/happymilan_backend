const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'mntechgroup2@gmail.com',
    pass: 'jmyukurxlllwaovd',
  },
});

// eslint-disable-next-line import/prefer-default-export
export async function sendMail(email) {
  // send mail with defined transport object
  return transporter.sendMail(email);
}
