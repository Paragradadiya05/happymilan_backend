const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'parag.180410107091@gmail.com',
    pass: 'ynspzgrmrqomnnip',
  },
});

// eslint-disable-next-line import/prefer-default-export
export async function sendMail(email) {
  // send mail with defined transport object
  return transporter.sendMail(email);
}
