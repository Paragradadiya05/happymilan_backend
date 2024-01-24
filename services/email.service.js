import nodemailer from 'nodemailer';
import config from 'config/config';
import { logger } from 'config/logger';

export const transport = nodemailer.createTransport(config.email.smtp);

/* istanbul ignore next */
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() => logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env'));
}
/**
 * Send an email
 * @returns {Promise}
 * @param emailParams
 */
export const sendEmail = async (emailParams) => {
  const { to, subject, text, isHtml } = emailParams;
  const msg = { from: config.email.from, to, subject, text };
  if (isHtml) {
    delete msg.text;
    msg.html = text;
  }

  console.log(' === variable ===> here  ', msg);
  await transport.sendMail(msg);
};

/**
 * Send an email
 * @param {String} from
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendAdminEmail = async (from, to, subject, text) => {
  const msg = { from: from || config.email.from, to, subject, text };
  await transport.sendMail(msg);
};
/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
export const sendResetPasswordEmail = async (to, token) => {
  const subject = 'Reset password';
  // replace this url with the link to the reset password page of your front-end app
  // const resetPasswordUrl = `http://link-to-app/reset-password?token=${token}`;
  const text = `Dear user,
  To reset your password, Copy this Code: ${token}
  If you did not request any password resets, then ignore this email.`;
  await sendEmail({ to, subject, text });
};

/**
 * Send Verification email
 * @param {Object} user
 * @param {string} token
 * @returns {Promise}
 */
export const sendEmailVerificationEmail = async (user, token) => {
  const { email: to, name } = user;
  const subject = 'Welcome to the Swaray Family!';
  // replace this url with the link to the reset password page of your front-end app
  const resetPasswordUrl = `${config.front.url}/v1/client/auth/verify-email?token=${token}`;
  const text = `
<html lang="en">
<head>
<style>
.btn {
  display: inline-block;
  font-weight: 400;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  border-radius: 0.25rem;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  color: #ffffff !important;
  background-color: #007bff;
  border: 1px solid #007bff;
  box-shadow: none;
  text-decoration: none;
}
.text-center {
text-align: center
}
</style>
</head>
<body>
<div>
<div>Dear ${name},</div>
<br>
  <div>We’re super excited that you’ve decided to join Swaray for Video Chat That’s Built to Party!</div><br>
  <div>You’re just one step away from getting access to fun, exciting, party and drinking games and Swaray’s legendary shared music experience.</div><br>
  <div>All you have to do is click the link below to confirm it’s you and you’re in!</div><br>
  <div><a   target="_blank" href="${resetPasswordUrl}" id="verifyButton" class="btn btn-primary" >Click here to Verify</a></div><br>
  <div>If for some reason you clicked the Sign-Up button in error or you didn’t Sign-Up with this email address</div>
  <div>in the first place, no need to worry.  You can completely ignore this email and we’ll delete the account for you.</div><br>
  <div>If you still have questions or concerns just shoot us a note at info@swarayallday.com and we’ll be sure to help you out.</div><br>
  <div>Thanks!</div><br/><br>
  <img src="${config.front.url}/images/logo.jpg"><br><br>
  <div class="text-center">Swaray LLC</div>
  <div class="text-center">627 Promontory Drive East</div>
  <div class="text-center">Newport Beach, CA 92660</div><br>
  <a class="text-center" target="_blank" href="https://www.google.com" >unsubscribe from this list</a><br><br>
  </div>
  </body>
  </html>
`;
  await sendEmail({ to, subject, text, isHtml: true });
};

/**
 * @param {Object} feedBack
 * @returns {Promise<void>}
 */
export const sendFeedBackEmail = async (feedBack) => {
  const { comment, user } = feedBack;
  const { name } = user;
  const subject = `Feedback received from ${name}`;
  const text = `Below is the feedback received from ${name} \n FeedBack: ${comment}`;
  await sendAdminEmail(config.email.from, config.email.from, subject, text);
};

/**
 * @returns {Promise<void>}
 * @param reporter
 * @param reportedUser
 * @param party
 * @param comment
 */
export const sendReportUserEmail = async (reporter, reportedUser, party, comment) => {
  const { name: reporterName, _id: reportedId } = reporter;
  const { name, _id: reportedUserId } = reportedUser;
  const subject = `Regarding Report of user ${name}`;
  const text = `${name}, ${reportedUserId} is blocked by ${reporterName}, ${reportedId} \n  The reason is : ${comment} \n partyId: ${party._id}`;
  await sendAdminEmail(config.email.from, config.email.from, subject, text);
};

/**
 * Send Verification email
 * @param {Object} user
 * @param otp
 * @returns {Promise}
 */
export const sendOtpVerificationEmail = async (user, otp) => {
  const { email: to, name } = user;
  const subject = 'Otp verification email!';
  const text = `
 <html>
 <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap">
 <title></title>
 <style type="text/css">
#parrent{
width: 700px;
height: 406px;
flex-shrink: 0;
tborder-radius: 14px;
tborder: 1px solid #E2E2E2;
}

#logo{
text-align: center;
padding-top: 30px;
}

#content div{
width: 622px;
}

#content div p{
color: #000;
font-family: Poppins;
font-size: 14px;
font-style: normal;
font-weight: 400;
line-height: normal;
}
#content{
display: flex;
justify-content: center;
margin-top: 30px;
}
#OTP-Text{
background: linear-gradient(97deg, #0F52BA 5.37%, #BA0FA9 20.06%);
background-clip: text;
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
font-family: Poppins;
font-size: 24px;
font-style: normal;
font-weight: 700;
line-height: normal;
}

#footer-box{
display: flex;
justify-content: center;
}

#footer{
width: 607px;
height: 1px;
border-top: 1px solid #E2E2E2;
text-align: center;
padding-top: 10px;
margin-top: 30px;

}

#footer-content{
width: 600px;
}


#footer div {
display: flex;
justify-content: space-between;
}
#footer div #ul-1{
list-style-type: none;
position: relative;
left: -30px;
}

#footer div #ul-1 li span{
color: #000;
font-family: Poppins;
font-size: 10px;
font-style: normal;
font-weight: 400;
line-height: normal;
}

#footer div #ul-2 li span {
color: #0F52BA;
font-family: Poppins;
font-size: 10px;
font-style: normal;
font-weight: 400;
line-height: normal;
}


#footer div #ul-2 li {
list-style-type: none;
display: flex;
gap: 20px;
}

#footer div #ul-2{
display: flex;
gap: 20px;
}

</style>
</head>
<body>
<div>

<div id="parrent">
<div id="logo">
<img src="../logo.svg" />
</div>
<div id="content">
<div>
<p>Dear User,${name}</p>
<p>Thank you for using our services. To complete the verification process, please enter the
following One-Time Password (OTP) on the verification page:</p>
<h1 id="OTP-Text"> ${otp}</h1> <!--OTP Variable -->
<p>Please do not share this OTP with anyone for security reasons</p>
</div>
</div>
<div id="footer-box">
<div id="footer">
<div id="footer-content">
<ul id="ul-1">
<li>
<span>Copyright 2023 MN Techgroup India</span>
</li>
</ul>
<ul id="ul-2">
<li>
<span>Privacy Policy</span>
</li>
<li><span>Terms of Use</span></li>

</ul>

</div>
</div>
</div>

</div>


</div>

</body>

</html>
`;
  await sendEmail({ to, subject, text, isHtml: true })
    .then(() => logger.info('email sent successfully'))
    .catch((error) => logger.warn(`Unable to send mail ${error}`));
};
