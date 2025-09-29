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
  // console.log('Sending this email message:', msg);
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
  const text = `
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap">
 <title></title>

 <style type="text/css">
 .btn {
    display: inline-block;
    color: #ffffff !important;
    justify-items: center;
    padding-top: 15px;
    white-space: nowrap;
    vertical-align: middle;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none; 
    user-select: none;
    transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    background: linear-gradient(123.55deg, #0F52BA 0%, #8225AF 81.56%);
    width: 175px;
    height: 38px;
    border-radius: 10px;
    align-content: center;
    text-align: center;
    font-family: Poppins;
    box-shadow: none;
    text-decoration: none;
    }
   
        #parrent {
            width: 100%;
            max-width: 700px;
            margin: 0 auto;
            border-radius: 14px;
            border: 1px solid #E2E2E2;
            justify-content: center;
            align-items: center;
        }

        #logo img {
            align-items: center;
            margin-left: 280px;
            padding-top: 30px;
            height: 32px;
            width: 130px;
        }

        #content div {
            width: 622px;
        }

        #content div p {
            color: #000;
            font-family: Poppins;
            font-size: 14px;
            font-style: normal;
            /*font-weight: 400;*/
            line-height: normal;
        }

        #content {
            margin-left: 40px;
            margin-top: 30px;
        }

        #OTP-Text {
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

        #footer-box {
            display: flex;
            justify-content: center;
        }

        #footer {
            width: 607px;
            height: 60px;
            border-top: 1px solid #E2E2E2;
            text-align: center;
            padding-top: 10px;
            margin-top: 30px;

        }

        #footer-content {
            width: 600px;
        }


        #footer div {
            display: flex;
            justify-content: space-between;
        }

        #footer div #ul-1 {
            list-style-type: none;
            position: relative;
            left: -30px;
        }

        #footer div #ul-1 li span {
            color: #000;
            font-family: Poppins;
            font-size: 10px;
            font-style: normal;
            /*font-weight: 400;*/
            line-height: normal;
        }

        #footer div #ul-2 li span {
            color: #0F52BA;
            font-family: Poppins;
            font-size: 10px;
            font-style: normal;
            /*font-weight: 900;*/
            line-height: normal;
        }


        #footer div #ul-2 li {
            list-style-type: none;
            display: flex;
            gap: 20px;
        }

        #footer div #ul-2 {
            display: flex;
            gap: 40px;
            justify-content: space-between;
        }

        @media only screen and (max-width: 600px) {
            #parrent {
                margin-left: 0;
            }

            #footer-content {
                width: 350px;
            }

            #logo img {
                align-items: center;
                margin-left: 270px;
                padding-top: 30px;
                height: 32px;
                width: 130px;
            }

        }
    </style>
</style>
</head>
<body>
 <div>

 <div id="parrent">
 <div id="logo">
   <img src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/users/65e991ad15835e46f0861b8b/65eff3406145b642700c32ba/logo.jpg" alt="logo"/>
 </div>
 <div id="content">
 <div>
     <p>Dear User,</p>
     <p>We received a request to reset the password for your account. If you initiated this request,
                 please use the following link to reset your password:
                 otp for forgot password : ${token}
     </p>
 <div><a target="_blank" href="${token}" id="verifyButton" class="btn btn-primary">Reset
           Password</a></div><br>
      <p>Note : Please note that the password reset link is valid for a limited time. After clicking the
                        link, you will be prompted to create a new password.</p>
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
  await sendEmail({ to, subject, text, isHtml: true });
};

/**
 * Send Verification email
 * @param {Object} user
 * @param {string} token
 * @returns {Promise}
 */
export const sendEmailVerificationEmail = async (user, token, password = '') => {
  const { email: to, name } = user;
  const subject = 'Welcome to the Swaray Family!';
  // replace this url with the link to the reset password page of your front-end app
  const resetPasswordUrl = `${config.front.url}v1/user/auth/verify-email?token=${token}`;
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
  
   <div v-if=${password}>
    <p>your Password: ${password}</p>
    <p>your Email: ${to}</p>
  </div>
  </div><br>
  <div></div><br>
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
  console.log(`Sending email to: ${to}`);
  const subject = 'Otp verification email!';
  const currentDate = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  const formattedDate = currentDate.toLocaleDateString('en-US', options);
  const text = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <title>Document</title>
    <style type="text/css">
        #main{
            display: flex; 
            width: 100%; 
            place-items: center; 
            justify-content: center;
        }
        #parrent{
            display: flex; 
            width: 80%; 
            justify-content: center; 
            background-color: rgb(240,244,249); 
            margin-top: 5.5%;
            margin-bottom: 5.5%;
            padding-top: 30px; 
            padding-bottom: 30px;
        }
        #content-div-width{
          width: 60%;
          margin: 0 auto;
        }
        #content-div{
            border-radius: 20px; 
            background-color: rgb(255,255,255); 
            padding: 8%;
        }
        #logo-div{
            display: flex; 
            justify-content: space-between;
            align-items: center;
            width: 100%;
        }
        #logo-img{
           width: 150px;
           height: 37px;
        }
        
        #content{
            margin-top: 30px;
        }
        #text-1{
            font-size: 12px; 
            font-weight: 400; 
            color: rgb(131,131,131);
            margin-left: auto;
        }
        #text-2{
            font-size: 14px;
            font-weight: 400;
            margin-top: 15px;
        }
        #text-3{
            font-size: 10px;
            font-weight: 400;
            text-align: center;
            width: 75%;
        }
        #otp-text{
            font-size: 14px;
            font-weight: 600;
            margin-top: 15px;
        }
        #div-center{
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            margin-left: 10%;
        }
      
        #socialmedia-div{
            width: 35%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-left: 25%;
            
        }
        #socialmedia-1{
            width:29px ;
            height: 20px;
            margin-right: 30px;
            
        }
        #socialmedia-2{
            width:10px ;
            height: 20px;
            margin-right: 30px;
        }
        #socialmedia-3{
            width: 20px;
            height: 20px;
            margin-right: 30px;
        }
        #socialmedia-4{
            width:25px ;
            height:20px ;
        }
        #border{
            width: 100%;
            height: 1px;
            border-color: #E2E2E2;
            margin-top: 20px;
        }
        #span-div{
            color: #0F52BA;
        }

        @media screen and (max-width: 1280px) {
            #logo-img{
           width: 130px;
           height: 35px;
        }
        #text-1{
            font-size: 10px; 
            font-weight: 400; 
            color: rgb(131,131,131);
        }
        #text-2{
            font-size: 12px;
            font-weight: 400;
            margin-top: 15px;
        }
        #text-3{
            font-size: 8px;
            font-weight: 400;
            text-align: center;
            width: 75%;
        }
        #otp-text{
            font-size: 12px;
            font-weight: 600;
            margin-top: 15px;
        }
        #socialmedia-1{
            width:27px ;
            height: 18px;
        }
        #socialmedia-2{
            width:8px ;
            height: 18px;
        }
        #socialmedia-3{
            width: 18px;
            height: 18px;
        }
        #socialmedia-4{
            width:23px ;
            height:18px ;
        }
        #content{
            margin-top: 25px;
        }
            
        } 
        @media screen and (max-width: 1024px) {
            #logo-img{
           width: 100px;
           height: 25px;
        }
        #text-1{
            font-size: 8px; 
            font-weight: 400; 
            color: rgb(131,131,131);
        }
        #text-2{
            font-size: 10px;
            font-weight: 400;
            margin-top: 15px;
        }
        #text-3{
            font-size: 7px;
            font-weight: 400;
            text-align: center;
            width: 75%;
        }
        #otp-text{
            font-size: 10px;
            font-weight: 600;
            margin-top: 15px;
        }
        #socialmedia-1{
            width:25px ;
            height: 16px;
        }
        #socialmedia-2{
            width:8px ;
            height: 16px;
        }
        #socialmedia-3{
            width: 16px;
            height: 16px;
        }
        #socialmedia-4{
            width:21px ;
            height:16px ;
        }
        #content{
            margin-top: 20px;
        }
       
            
        } 

    </style>

</head>
<body>
    
    <div id="main" >
        <div id="parrent" >
            <div id="content-div-width">
                <div id="content-div" >
                <div id="logo-div">
            <img id="logo-img" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/users/65e991ad15835e46f0861b8b/65eff3406145b642700c32ba/logo.jpg"/>
<h1 id="text-1" >${formattedDate}</h1>
</div>
<div id="content">
    <h1 id="text-2">Hi ${name}</h1>
    <h1 id="text-2">Thank you for using our services. To complete the verification process, please enter the following One-Time Password (OTP) on the verification page:</h1>
    <h1 id="otp-text">OTP : ${otp}</h1>
    <h1 id="text-2">Please do not share this OTP with anyone for security reasons</h1>
</div>
</div>
<div id="content">
    <div id="div-center">
    <h1 id="text-3" > Welcome to HappyMilan your hub for finding a life partner, exploring dating opportunities, and making new friends. Join us to connect with a vibrant community and discover meaningful relationships.</h1>
    </div>
    <div id="content">
        <div id="div-center">
        <div id="socialmedia-div" >
           <div>
           <img id="socialmedia-1" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/yticone/671777d63e6cb9ad5f202b0d/yt.jpg" alt="youtube"/>
           </div>
           <div>
            <img id="socialmedia-2" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/fbicone/671776dc3e6cb9ad5f202b01/fb.jpg" alt="fb"/>
           </div>
           <div>
            <img id="socialmedia-3" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/instagramicone/671777513e6cb9ad5f202b05/insta.jpg" alt="insta"/>
           </div>
           <div>
            <img id="socialmedia-4" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/twittericone/6717779d3e6cb9ad5f202b09/Twitter.jpg" alt="twitter"/>
           </div>
        </div>
        </div>
    </div>
    <hr id="border"/>
    <div id="content">
        <div id="div-center">
        <h1 id="text-3">If you prefer not to receive these emails in the future, please <span id="span-div"> unsubscribe </span> here.</h1>
    </div>
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

export const sendCongratulationEmail = async (user) => {
  const { email: to, name } = user;
  const subject = 'Congratulation email!';
  const currentDate = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  const formattedDate = currentDate.toLocaleDateString('en-US', options);
  const text = `
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Congratulation Email</title>
    <style type="text/css">
        body {
            font-family: 'Poppins', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f0f4f9;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            box-sizing: border-box;
        }
        #main {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 90%;
        }
        #container {
            width: 70%;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
            margin: auto;
        }
        #text-1{
        color: black;
        }
         #text-4{
        color: black;
         font-weight: 600;
      }
        #mar-top{
        margin-top: 20px;
        }
        #perrent{
         justify-content: center;
        }
      #logo-div{
       display: flex;
       position: relative;
      
      }
        #logo-img {
            width: 150px;
            height: auto;
           
            
        }
        #demo{
        width: 100%;
        }
        #date {
            font-size: 12px;
            color: #838383;
           
            position: absolute;
            margin-left: 500px;
        }
        #text-2{
        color: black;
        text-align: center; 
        }
        #content {
            margin-top: 20px;
            font-size: 14px;
            line-height: 1.6;
        }
        #bold-text {
           
            font-weight: 600;
            margin-top: 10px;
        }
       #socialmedia-div{
            width: 35%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-left: 35%;
            margin-top: 30px;
            margin-bottom: 10px;
        }
        #socialmedia-1{
            width:29px ;
            height: 20px;
            margin-right: 30px;
            
        }
        #socialmedia-2{
            width:10px ;
            height: 20px;
            margin-right: 30px;
        }
        #socialmedia-3{
            width: 20px;
            height: 20px;
            margin-right: 30px;
        }
        #socialmedia-4{
            width:25px ;
            height:20px ;
        }
        #unsubscribe {
            text-align: center;
            margin-top: 40px;
            font-size: 12px;
            color: black;
        }
        #border{
            margin-top: 30px;
            margin-bottom: 5px;
            width: 100%;
            height:0.1px;
            background: black;
        }
        @media screen and (max-width: 768px) {
        #logo-img{
           width: 100px;
           height: 25px;
          
        }
         #logo-div{
      display: flex;
       position: relative;
      
      }
        #text-1{
            font-size: 8px; 
            font-weight: 400; 
            color: black;
        }
        #text-2{
            font-size: 10px;
            font-weight: 400;
            margin-top: 15px;
        }
        #text-3{
            font-size: 7px;
            font-weight: 400;
            text-align: center;
            width: 75%;
        }
        #otp-text{
            font-size: 10px;
            font-weight: 600;
            margin-top: 15px;
        }
        #socialmedia-1{
            width:25px ;
            height: 16px;
        }
        #socialmedia-2{
            width:8px ;
            height: 16px;
        }
        #socialmedia-3{
            width: 16px;
            height: 16px;
        }
        #socialmedia-4{
            width:21px ;
            height:16px ;
        }
        #content{
            margin-top: 20px;
        }
       
            #main {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 90%;
            padding: 0px;
        }
        #container {
            width: 90%;
            max-width: 600px;
            background-color: #ffffff;
            border-radius: 10px;
           box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
            margin: auto;
            padding: 0px;
        }
        #logo-div {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
        }
        
        #date {
            font-size: 12px;
            margin-left: 0%;
            width: 150px;
            
        }
        }
        /*xl*/
        @media screen and (max-width: 1536px) {
        #date {
            font-size: 12px;
            color: #838383;
            position: absolute;
           text-align: right;
           margin-left: 360px;
        }
 }
        @media screen and (max-width: 1280px) {
            #logo-img{
           width: 130px;
           height: 35px;
        }
        #date {
            font-size: 10px;
            color: #838383;
            position: absolute;
           text-align: right;
           margin-left: 280px;
        }
        #container {
            width: 80%;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
            margin: auto;
        }
       
        #socialmedia-div{
            width: 35%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-left: 35%;
            margin-top: 30px;
            margin-bottom: 10px;
        }
       
       
        #socialmedia-1{
            width:27px ;
            height: 18px;
        }
        #socialmedia-2{
            width:8px ;
            height: 18px;
        }
        #socialmedia-3{
            width: 18px;
            height: 18px;
        }
        #socialmedia-4{
            width:23px ;
            height:18px ;
        }
        #content{
            margin-top: 25px;
        }
            
        } 
        
        @media screen and (max-width: 1024px) {
            #logo-img{
           width: 100px;
           height: 25px;
        }
        #date {
            font-size: 8px;
            color: #838383;
            position: absolute;
           text-align: right;
           margin-left: -100px;
          
        }
        #main {
            
            align-items: center;
            width: 100%;
        }
        #text-1{
        color: black;
        font-size: 10px;
        }
            #container {
               
                width: 100%;
            }
            #content {
                font-size: 10px;
            }
           #socialmedia-div{
            width: 35%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-left: 30%;
            margin-top: 25px;
            margin-bottom: 10px;
        }
        
        #socialmedia-1{
            width:25px ;
            height: 16px;
        }
        #socialmedia-2{
            width:8px ;
            height: 16px;
        }
        #socialmedia-3{
            width: 16px;
            height: 16px;
        }
        #socialmedia-4{
            width:21px ;
            height:16px ;
        }
        
       
        } 
    </style>
</head>
<body>
    <div id="main">
        <div id="container">
        <div id="perrent">
        <div id="logo-div">
            
                <img id="logo-img" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/users/65e991ad15835e46f0861b8b/65eff3406145b642700c32ba/logo.jpg" alt="Logo"/>
               <p id="date">${formattedDate}</p>
               </div>
            <div id="content">
                <p id="text-1">Hi ${name},</p>
                <p id="text-1">Welcome to HappyMilan! We're excited to have you with us. Congrats on registering your account!</p>
                <p id="text-1">To get started, log in to your account using the following credentials:</p>
                <p id="text-4">Email: ${to} <br> Password: ******</p>
                <div id="mar-top">
                    <img id="demo" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/Img/672221cd16359520d1b37284/search.jpg" alt="Feature Image"/>
                </div>  
                <div>
                    <img id="demo" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/Img/672221fb16359520d1b372ae/secure.jpg" alt="Feature Image"/>
                </div>  
                <div>
                    <img id="demo" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/Img/6722215c16359520d1b3727c/chat.jpg" alt="Feature Image"/>
                </div> 
                <div>
                    <img id="demo" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/Img/6722219c16359520d1b37280/plan.jpg" alt="Feature Image"/>
                </div> 
                <p id="text-2">Welcome to HappyMilan, your hub for finding a life partner, exploring dating opportunities, and making new friends. Join us to connect with a vibrant community and discover meaningful relationships.</p>
            </div>
            <div id="content">
        <div id="div-center">
        <div id="socialmedia-div" >
           <div>
           <img id="socialmedia-1" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/yticone/671777d63e6cb9ad5f202b0d/yt.jpg" alt="youtube"/>
           </div>
           <div>
            <img id="socialmedia-2" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/fbicone/671776dc3e6cb9ad5f202b01/fb.jpg" alt="fb"/>
           </div>
           <div>
            <img id="socialmedia-3" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/instagramicone/671777513e6cb9ad5f202b05/insta.jpg" alt="insta"/>
           </div>
           <div>
            <img id="socialmedia-4" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/twittericone/6717779d3e6cb9ad5f202b09/Twitter.jpg" alt="twitter"/>
           </div>
        </div>
     
        </div>
      <hr id="border"/>
    </div>
            <p id="unsubscribe">If you prefer not to receive these emails in the future, please <a href="#" style="color: #0F52BA; text-decoration: none;">unsubscribe</a> here.</p>
        </div>
        </div>
        
    </div>
</body>
</html>`;

  await sendEmail({ to, subject, text, isHtml: true })
    .then(() => logger.info('email sent successfully'))
    .catch((error) => logger.warn(`Unable to send mail ${error}`));
};

export const sendEmailForStoryConsentTaken = async (partnerUser, token) => {
  const { email: to, name } = partnerUser;
  const subject = 'Story consent';
  // replace this url with the link to the reset password page of your front-end app
  const consentTakingUrl = `${config.front.url}/v1/user/story/verify-story-consent?consentToken=${token}`;

  const text = `
<html lang="en">
<head>
<style>
  body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f4f4f9;
    color: #333;
    line-height: 1.6;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  h1, p {
    text-align: center;
  }
  .btn {
    display: inline-block;
    font-weight: 400;
    text-align: center;
    white-space: nowrap;
    vertical-align: middle;
    user-select: none;
    padding: 12px 24px;
    font-size: 16px;
    line-height: 1.5;
    border-radius: 5px;
    transition: all 0.3s ease;
    color: #ffffff !important;
    background-color: #007bff;
    border: 1px solid #007bff;
    text-decoration: none;
  }
  .btn:hover {
    background-color: #0056b3;
    border-color: #004085;
  }
  .text-center {
    text-align: center;
  }
  .logo {
    text-align: center;
    margin-top: 20px;
  }
  .footer {
    text-align: center;
    margin-top: 40px;
    font-size: 12px;
    color: #777;
  }
  .footer a {
    color: #007bff;
    text-decoration: none;
  }
</style>
</head>
<body>
  <div class="container">
    <h1>Story Consent Verification</h1>
    <p>Dear ${name},</p>
    <p>Please click the button below to verify your consent for the story.</p>
    
    <div class="text-center">
      <a href="${consentTakingUrl}" target="_blank" class="btn">Click here to Verify</a>
    </div>
   
  </div>
</body>
</html>

`;
  await sendEmail({ to, subject, text, isHtml: true });
};

/**
 * Send reset password email
 * @param {string} to
 * @param {number} otp
 * @param {string} emailOrMobileTag
 * @returns {Promise}
 */
export const sendResetEmailOtp = async (to, otp, emailOrMobileTag) => {
  console.log('=== var to ===>', to);

  const subject = `Reset ${emailOrMobileTag}`;
  // replace this url with the link to the reset password page of your front-end app
  // const resetPasswordUrl = `http://link-to-app/reset-password?token=${token}`;
  const text = `
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap">
 <title></title>

 <style type="text/css">
 .btn {
    display: inline-block;
    color: #ffffff !important;
    justify-items: center;
    padding-top: 15px;
    white-space: nowrap;
    vertical-align: middle;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none; 
    user-select: none;
    transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    background: linear-gradient(123.55deg, #0F52BA 0%, #8225AF 81.56%);
    width: 175px;
    height: 38px;
    border-radius: 10px;
    align-content: center;
    text-align: center;
    font-family: Poppins;
    box-shadow: none;
    text-decoration: none;
    }
   
        #parrent {
            width: 100%;
            max-width: 700px;
            margin: 0 auto;
            border-radius: 14px;
            border: 1px solid #E2E2E2;
            justify-content: center;
            align-items: center;
        }

        #logo img {
            align-items: center;
            margin-left: 280px;
            padding-top: 30px;
            height: 32px;
            width: 130px;
        }

        #content div {
            width: 622px;
        }

        #content div p {
            color: #000;
            font-family: Poppins;
            font-size: 14px;
            font-style: normal;
            /*font-weight: 400;*/
            line-height: normal;
        }

        #content {
            margin-left: 40px;
            margin-top: 30px;
        }

        #OTP-Text {
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

        #footer-box {
            display: flex;
            justify-content: center;
        }

        #footer {
            width: 607px;
            height: 60px;
            border-top: 1px solid #E2E2E2;
            text-align: center;
            padding-top: 10px;
            margin-top: 30px;

        }

        #footer-content {
            width: 600px;
        }


        #footer div {
            display: flex;
            justify-content: space-between;
        }

        #footer div #ul-1 {
            list-style-type: none;
            position: relative;
            left: -30px;
        }

        #footer div #ul-1 li span {
            color: #000;
            font-family: Poppins;
            font-size: 10px;
            font-style: normal;
            /*font-weight: 400;*/
            line-height: normal;
        }

        #footer div #ul-2 li span {
            color: #0F52BA;
            font-family: Poppins;
            font-size: 10px;
            font-style: normal;
            /*font-weight: 900;*/
            line-height: normal;
        }


        #footer div #ul-2 li {
            list-style-type: none;
            display: flex;
            gap: 20px;
        }

        #footer div #ul-2 {
            display: flex;
            gap: 40px;
            justify-content: space-between;
        }

        @media only screen and (max-width: 600px) {
            #parrent {
                margin-left: 0;
            }

            #footer-content {
                width: 350px;
            }

            #logo img {
                align-items: center;
                margin-left: 270px;
                padding-top: 30px;
                height: 32px;
                width: 130px;
            }

        }
    </style>
</style>
</head>
<body>
 <div>

 <div id="parrent">
 <div id="logo">
   <img src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/users/65e991ad15835e46f0861b8b/65eff3406145b642700c32ba/logo.jpg" alt="logo"/>
 </div>
 <div id="content">
 <div>
     <p>Dear User,</p>
     <p>We received a request to reset the emai of mobile number for your account. If you initiated this request,
                 please use the following link to reset your cred:
                 otp for change cred: ${otp}
     </p>
      <p>Note : Please note that the cred reset link is valid for a limited time. After clicking the
                        link, you will be prompted to create a new cred .</p>
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
  await sendEmail({ to, subject, text, isHtml: true });
};

export const DeleteUserEmail = async (user) => {
  const { email: to, name } = user;
  console.log(`Sending email to: ${to}`);
  const subject = 'Account Deletion Confirmation';
  const currentDate = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  const formattedDate = currentDate.toLocaleDateString('en-US', options);
  const text = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <title>Document</title>
    <style type="text/css">
        #main{
            display: flex; 
           
            place-items: center; 
            justify-content: center;
        }
        #parrent{
            display: flex; 
            width: 80%; 
            justify-content: center; 
            background-color: rgb(240,244,249); 
            margin-top: 5.5%;
            margin-bottom: 5.5%;
            padding-top: 30px; 
            padding-bottom: 30px;
        }
        #content-div-width{
          width: 80%;
          margin: 0 auto;
        }
        #content-div{
            border-radius: 20px; 
            background-color: rgb(255,255,255); 
            padding: 8%;
        }
        #logo-div{
            display: flex; 
            justify-content: space-between;
            align-items: center;
            width: 100%;
        }
        #logo-img{
           width: 150px;
           height: 37px;
        }
        
        #content{
            margin-top: 30px;
        }
        #text-1{
            font-size: 12px; 
            font-weight: 400; 
            color: black;
            margin-left: auto;
        }
        #text-2{
            font-size: 14px;
            font-weight: 400;
            margin-top: 15px;
          
        }
        #text-3{
            font-size: 12px;
            font-weight: 400;
            width: 75%;
        }
        #text-4{
            font-size: 14px;
            font-weight: 400;
            margin-top: 15px;
            text-align: center;
            width: 80%;
            color: black;
        }
        #otp-text{
            font-size: 14px;
            font-weight: 600;
            margin-top: 15px;
        }
        #div-center{
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            margin-left: 10%;
        }
      
        #socialmedia-div{
            width: 35%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-left: 25%;
            
        }
        #socialmedia-1{
            width:29px ;
            height: 20px;
            margin-right: 30px;
            
        }
        #socialmedia-2{
            width:10px ;
            height: 20px;
            margin-right: 30px;
        }
        #socialmedia-3{
            width: 20px;
            height: 20px;
            margin-right: 30px;
        }
        #socialmedia-4{
            width:25px ;
            height:20px ;
        }
        #border{
            width: 100%;
            height: 1px;
            border-color: #E2E2E2;
            margin-top: 20px;
        }
        #span-div{
            color: #0F52BA;
        }

        @media screen and (max-width: 1280px) {
            #logo-img{
           width: 130px;
           height: 35px;
        }
        #text-1{
            font-size: 10px; 
            font-weight: 400; 
            color: rgb(131,131,131);
        }
        #text-2{
            font-size: 12px;
            font-weight: 400;
            margin-top: 15px;
           
        }
        #text-3{
            font-size: 8px;
            font-weight: 400;
            text-align: center;
            width: 75%;
        }
          #text-4{
            font-size: 14px;
            font-weight: 400;
            margin-top: 15px;
            text-align: center;
            width: 80%;
            color: black;
        }
        #otp-text{
            font-size: 12px;
            font-weight: 600;
            margin-top: 15px;
        }
        #socialmedia-1{
            width:27px ;
            height: 18px;
        }
        #socialmedia-2{
            width:8px ;
            height: 18px;
        }
        #socialmedia-3{
            width: 18px;
            height: 18px;
        }
        #socialmedia-4{
            width:23px ;
            height:18px ;
        }
        #content{
            margin-top: 25px;
        }
            
        } 
        @media screen and (max-width: 1024px) {
            #logo-img{
           width: 100px;
           height: 25px;
        }
        #text-1{
            font-size: 8px; 
            font-weight: 400; 
            color: black;
        }
        #text-2{
             font-size: 10px;
            font-weight: 400;
            margin-top: 15px;
            color: black;
        }
        #text-3{
            font-size: 7px;
            font-weight: 400;
            text-align: center;
            width: 75%;
        }
          #text-4{
            font-size: 14px;
            font-weight: 400;
            margin-top: 15px;
            text-align: center;
            width: 80%;
            color: black;
        }
        #otp-text{
            font-size: 10px;
            font-weight: 600;
            margin-top: 15px;
        }
        #socialmedia-1{
            width:25px ;
            height: 16px;
        }
        #socialmedia-2{
            width:8px ;
            height: 16px;
        }
        #socialmedia-3{
            width: 16px;
            height: 16px;
        }
        #socialmedia-4{
            width:21px ;
            height:16px ;
        }
        #content{
            margin-top: 20px;
        }
       
            
        } 

    </style>

</head>
<body>
    
    <div id="main" >
        <div id="parrent" >
            <div id="content-div-width">
                <div id="content-div" >
                <div id="logo-div">
            <img id="logo-img" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/users/65e991ad15835e46f0861b8b/65eff3406145b642700c32ba/logo.jpg"/>
<h1 id="text-1" >${formattedDate}</h1>
</div>
<div id="content">
    <h1 id="text-1">Dear ${name},</h1>
    <h1 id="text-1">Your account on HappyMilan has been successfully deleted, including: </h1>
        

                   <li id="text-1"> Profile information</li> 
                   <li id="text-1"> Photos, Messages or emails </li> 
                   <li id="text-1">  Other shared data </li>
      

       <p id="text-1">Your data has been permanently removed in line with our privacy policy. We’d be happy to welcome you back anytime. If you have questions, contact us at </p>
       <h1 id="text-3"> contact@happymilan.com. </h1>

         <h1 id="text-1">Thank you for being part of HappyMilan. </h1>

       <h1 id="text-1">Best regards,</h1>
        <h1 id="text-1">HappyMilan Team </h1>
  
 
</div>
</div>
<div id="content">
    <div id="div-center">
        <h1 id="text-4">Welcome to HappyMilan your hub for finding a life partner, exploring dating opportunities, and making new friends. Join us to connect with a vibrant community and discover meaningful relationships.</h1>
    </div>
    <div id="content">
        <div id="div-center">
        <div id="socialmedia-div" >
           <div>
           <img id="socialmedia-1" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/yticone/671777d63e6cb9ad5f202b0d/yt.jpg" alt="youtube"/>
           </div>
           <div>
            <img id="socialmedia-2" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/fbicone/671776dc3e6cb9ad5f202b01/fb.jpg" alt="fb"/>
           </div>
           <div>
            <img id="socialmedia-3" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/instagramicone/671777513e6cb9ad5f202b05/insta.jpg" alt="insta"/>
           </div>
           <div>
            <img id="socialmedia-4" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/twittericone/6717779d3e6cb9ad5f202b09/Twitter.jpg" alt="twitter"/>
           </div>
        </div>
        </div>
    </div>
    <hr id="border"/>
    <div id="content">
        <div id="div-center">
        <h1 id="text-3">If you prefer not to receive these emails in the future, please <span id="span-div"> unsubscribe </span> here.</h1>
    </div>
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

export const sendPlanConfirmationEmail = async (user) => {
  const { email: to, name, planName, startDate, endDate, price } = user;
  const subject = 'Your Plan is Now Active – Welcome to Premium!';

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
        user-select: none;
        padding: 0.375rem 0.75rem;
        font-size: 1rem;
        line-height: 1.5;
        border-radius: 0.25rem;
        transition: 0.15s ease-in-out;
        color: #ffffff !important;
        background-color: #28a745;
        border: 1px solid #28a745;
        text-decoration: none;
      }
      .text-center {
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div>
      <div>Dear ${name},</div><br>
      
      <div>🎉 Thank you for upgrading to our premium plan!</div><br>

      <div>Here are your subscription details:</div><br>
      <ul>
        <li><strong>Plan:</strong> ${planName}</li>
        <li><strong>Start Date:</strong> ${new Date(startDate).toDateString()}</li>
        <li><strong>End Date:</strong> ${new Date(endDate).toDateString()}</li>
        <li><strong>Total Price:</strong> ₹${price}</li>
      </ul><br>

      <div>We're thrilled to have you on board. Your premium access is now active and you can enjoy all the exclusive features we offer.</div><br>

      <div>If you have any questions or need support, feel free to contact us at support@example.com</div><br>

      <div>Thanks again for choosing us!</div><br><br>

      <img src="${config.front.url}/images/logo.jpg"><br><br>

      <a class="text-center" target="_blank" href="https://www.google.com">unsubscribe from this list</a><br><br>
    </div>
  </body>
  </html>
  `;

  await sendEmail({ to, subject, text, isHtml: true });
};

export const sendKycApprovedEmail = async (user) => {
  const { email: to, firstName } = user;
  console.log(`Sending KYC approved email to: ${to}`);
  const subject = 'KYC Approved!';
  // const currentDate = new Date();
  // const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  // const formattedDate = currentDate.toLocaleDateString('en-US', options);

  const text = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <title>Document</title>
    <style type="text/css">
        #main{
            display: flex; 
            width: 100%; 
            place-items: center; 
            justify-content: center;
        }
        #parrent{
            display: flex; 
            width: 80%; 
            justify-content: center; 
            background-color: rgb(240,244,249); 
            margin-top: 5.5%;
            margin-bottom: 5.5%;
            padding-top: 30px; 
            padding-bottom: 30px;
        }
        #content-div-width{
          width: 60%;
          margin: 0 auto;
        }
        #content-div{
            border-radius: 20px; 
            background-color: rgb(255,255,255); 
            padding: 8%;
        }
        #logo-div{
            display: flex; 
            justify-content: space-between;
            align-items: center;
            width: 100%;
        }
        #logo-img{
           width: 150px;
           height: 37px;
        }
        
        #content{
            margin-top: 30px;
        }
        #text-1{
            font-size: 12px; 
            font-weight: 400; 
            color: rgb(131,131,131);
            margin-left: auto;
        }
        #text-2{
            font-size: 14px;
            font-weight: 400;
            margin-top: 15px;
        }
        #text-3{
            font-size: 10px;
            font-weight: 400;
            text-align: center;
            width: 75%;
        }
        #otp-text{
            font-size: 14px;
            font-weight: 600;
            margin-top: 15px;
        }
        #div-center{
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            margin-left: 10%;
        }
      
        #socialmedia-div{
            width: 35%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-left: 25%;
            
        }
        #socialmedia-1{
            width:29px ;
            height: 20px;
            margin-right: 30px;
            
        }
        #socialmedia-2{
            width:10px ;
            height: 20px;
            margin-right: 30px;
        }
        #socialmedia-3{
            width: 20px;
            height: 20px;
            margin-right: 30px;
        }
        #socialmedia-4{
            width:25px ;
            height:20px ;
        }
        #border{
            width: 100%;
            height: 1px;
            border-color: #E2E2E2;
            margin-top: 20px;
        }
        #span-div{
            color: #0F52BA;
        }

        @media screen and (max-width: 1280px) {
            #logo-img{
           width: 130px;
           height: 35px;
        }
        #text-1{
            font-size: 10px; 
            font-weight: 400; 
            color: rgb(131,131,131);
        }
        #text-2{
            font-size: 12px;
            font-weight: 400;
            margin-top: 15px;
        }
        #text-3{
            font-size: 8px;
            font-weight: 400;
            text-align: center;
            width: 75%;
        }
        #otp-text{
            font-size: 12px;
            font-weight: 600;
            margin-top: 15px;
        }
        #socialmedia-1{
            width:27px ;
            height: 18px;
        }
        #socialmedia-2{
            width:8px ;
            height: 18px;
        }
        #socialmedia-3{
            width: 18px;
            height: 18px;
        }
        #socialmedia-4{
            width:23px ;
            height:18px ;
        }
        #content{
            margin-top: 25px;
        }
            
        } 
        @media screen and (max-width: 1024px) {
            #logo-img{
           width: 100px;
           height: 25px;
        }
        #text-1{
            font-size: 8px; 
            font-weight: 400; 
            color: rgb(131,131,131);
        }
        #text-2{
            font-size: 10px;
            font-weight: 400;
            margin-top: 15px;
        }
        #text-3{
            font-size: 7px;
            font-weight: 400;
            text-align: center;
            width: 75%;
        }
        #otp-text{
            font-size: 10px;
            font-weight: 600;
            margin-top: 15px;
        }
        #socialmedia-1{
            width:25px ;
            height: 16px;
        }
        #socialmedia-2{
            width:8px ;
            height: 16px;
        }
        #socialmedia-3{
            width: 16px;
            height: 16px;
        }
        #socialmedia-4{
            width:21px ;
            height:16px ;
        }
        #content{
            margin-top: 20px;
        }
       
            
        } 

    </style>

</head>
<body>
    
    <div id="main" >
        <div id="parrent" >
            <div id="content-div-width">
                <div id="content-div" >
                <div id="logo-div">
            <img id="logo-img" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/hapmeetlogo/68da817300d1d0d47d48e8fa/logo.svg"/>
</div>
<div id="content">
    <h1 id="text-2">Dear ${firstName || 'User'}</h1>
    <h1 id="text-2">Were happy to inform you that your KYC verification has been successfully approved.</h1>
    <h1 id="otp-text">Your account is now verified and fully active. </h1>
    <h1 id="text-2">If you have any questions, feel free to reach out to our support team. </h1>
</div>
<div id="content">
    <h1 id="text-2">Best regards, </h1>
    <h1 id="text-2">Hapmeet Team </h1>
</div>
</div>
<div id="content">
    <div id="div-center">
    <h1 id="text-3" > Welcome to Hapmeet your hub for finding a life partner, exploring dating opportunities, and making new friends. Join us to connect with a vibrant community and discover meaningful relationships.</h1>
    </div>
    <div id="content">
        <div id="div-center">
        <div id="socialmedia-div" >
           <div>
           <img id="socialmedia-1" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/yticone/671777d63e6cb9ad5f202b0d/yt.jpg" alt="youtube"/>
           </div>
           <div>
            <img id="socialmedia-2" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/fbicone/671776dc3e6cb9ad5f202b01/fb.jpg" alt="fb"/>
           </div>
           <div>
            <img id="socialmedia-3" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/instagramicone/671777513e6cb9ad5f202b05/insta.jpg" alt="insta"/>
           </div>
           <div>
            <img id="socialmedia-4" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/twittericone/6717779d3e6cb9ad5f202b09/Twitter.jpg" alt="twitter"/>
           </div>
        </div>
        </div>
    </div>
    <hr id="border"/>
    <div id="content">
        <div id="div-center">
        <h1 id="text-3">If you prefer not to receive these emails in the future, please <span id="span-div"> unsubscribe </span> here.</h1>
    </div>
    </div>
</div>
            </div>
        </div>
    </div>
    
</body>
</html>
`;

  await sendEmail({ to, subject, text, isHtml: true })
    .then(() => logger.info('KYC approval email sent successfully'))
    .catch((error) => logger.warn(`Unable to send KYC approval email: ${error}`));
};

export const sendKycRejectedEmail = async (user, reason) => {
  const { email: to, firstName } = user;
  console.log(`Sending KYC rejected email to: ${to}`);
  const subject = 'KYC Rejected';
  // const currentDate = new Date();
  // const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  // const formattedDate = currentDate.toLocaleDateString('en-US', options);

  const text = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <title>Document</title>
    <style type="text/css">
        #main{
            display: flex; 
            width: 100%; 
            place-items: center; 
            justify-content: center;
        }
        #parrent{
            display: flex; 
            width: 80%; 
            justify-content: center; 
            background-color: rgb(240,244,249); 
            margin-top: 5.5%;
            margin-bottom: 5.5%;
            padding-top: 30px; 
            padding-bottom: 30px;
        }
        #content-div-width{
          width: 60%;
          margin: 0 auto;
        }
        #content-div{
            border-radius: 20px; 
            background-color: rgb(255,255,255); 
            padding: 8%;
        }
        #logo-div{
            display: flex; 
            justify-content: space-between;
            align-items: center;
            width: 100%;
        }
        #logo-img{
           width: 150px;
           height: 37px;
        }
        
        #content{
            margin-top: 30px;
        }
        #text-1{
            font-size: 12px; 
            font-weight: 400; 
            color: rgb(131,131,131);
            margin-left: auto;
        }
        #text-2{
            font-size: 14px;
            font-weight: 400;
            margin-top: 15px;
        }
        #text-3{
            font-size: 10px;
            font-weight: 400;
            text-align: center;
            width: 75%;
        }
        #otp-text{
            font-size: 14px;
            font-weight: 600;
            margin-top: 15px;
        }
        #div-center{
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            margin-left: 10%;
        }
      
        #socialmedia-div{
            width: 35%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-left: 25%;
            
        }
        #socialmedia-1{
            width:29px ;
            height: 20px;
            margin-right: 30px;
            
        }
        #socialmedia-2{
            width:10px ;
            height: 20px;
            margin-right: 30px;
        }
        #socialmedia-3{
            width: 20px;
            height: 20px;
            margin-right: 30px;
        }
        #socialmedia-4{
            width:25px ;
            height:20px ;
        }
        #border{
            width: 100%;
            height: 1px;
            border-color: #E2E2E2;
            margin-top: 20px;
        }
        #span-div{
            color: #0F52BA;
        }

        @media screen and (max-width: 1280px) {
            #logo-img{
           width: 130px;
           height: 35px;
        }
        #text-1{
            font-size: 10px; 
            font-weight: 400; 
            color: rgb(131,131,131);
        }
        #text-2{
            font-size: 12px;
            font-weight: 400;
            margin-top: 15px;
        }
        #text-3{
            font-size: 8px;
            font-weight: 400;
            text-align: center;
            width: 75%;
        }
        #otp-text{
            font-size: 12px;
            font-weight: 600;
            margin-top: 15px;
        }
        #socialmedia-1{
            width:27px ;
            height: 18px;
        }
        #socialmedia-2{
            width:8px ;
            height: 18px;
        }
        #socialmedia-3{
            width: 18px;
            height: 18px;
        }
        #socialmedia-4{
            width:23px ;
            height:18px ;
        }
        #content{
            margin-top: 25px;
        }
            
        } 
        @media screen and (max-width: 1024px) {
            #logo-img{
           width: 100px;
           height: 25px;
        }
        #text-1{
            font-size: 8px; 
            font-weight: 400; 
            color: rgb(131,131,131);
        }
        #text-2{
            font-size: 10px;
            font-weight: 400;
            margin-top: 15px;
        }
        #text-3{
            font-size: 7px;
            font-weight: 400;
            text-align: center;
            width: 75%;
        }
        #otp-text{
            font-size: 10px;
            font-weight: 600;
            margin-top: 15px;
        }
        #socialmedia-1{
            width:25px ;
            height: 16px;
        }
        #socialmedia-2{
            width:8px ;
            height: 16px;
        }
        #socialmedia-3{
            width: 16px;
            height: 16px;
        }
        #socialmedia-4{
            width:21px ;
            height:16px ;
        }
        #content{
            margin-top: 20px;
        }
       
            
        } 

    </style>

</head>
<body>
    
    <div id="main" >
        <div id="parrent" >
            <div id="content-div-width">
                <div id="content-div" >
                <div id="logo-div">
            <img id="logo-img" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/hapmeetlogo/68da817300d1d0d47d48e8fa/logo.svg"/>
</div>
<div id="content">
    <h1 id="text-2">Dear ${firstName || 'User'}</h1>
    <h1 id="text-2"><p>
        Reason: <strong>${reason || 'Not specified'}</strong></p></h1>
    <h1 id="otp-text">Your account is now verified and fully active. </h1>
    <h1 id="text-2">Please re-upload a valid document via your dashboard.For help, contact support. </h1>
</div>
<div id="content">
    <h1 id="text-2">Best regards, </h1>
    <h1 id="text-2">Hapmeet Team </h1>
</div>
</div>
<div id="content">
    <div id="div-center">
    <h1 id="text-3" > Welcome to Hapmeet your hub for finding a life partner, exploring dating opportunities, and making new friends. Join us to connect with a vibrant community and discover meaningful relationships.</h1>
    </div>
    <div id="content">
        <div id="div-center">
        <div id="socialmedia-div" >
           <div>
           <img id="socialmedia-1" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/yticone/671777d63e6cb9ad5f202b0d/yt.jpg" alt="youtube"/>
           </div>
           <div>
            <img id="socialmedia-2" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/fbicone/671776dc3e6cb9ad5f202b01/fb.jpg" alt="fb"/>
           </div>
           <div>
            <img id="socialmedia-3" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/instagramicone/671777513e6cb9ad5f202b05/insta.jpg" alt="insta"/>
           </div>
           <div>
            <img id="socialmedia-4" src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/twittericone/6717779d3e6cb9ad5f202b09/Twitter.jpg" alt="twitter"/>
           </div>
        </div>
        </div>
    </div>
    <hr id="border"/>
    <div id="content">
        <div id="div-center">
        <h1 id="text-3">If you prefer not to receive these emails in the future, please <span id="span-div"> unsubscribe </span> here.</h1>
    </div>
    </div>
</div>
            </div>
        </div>
    </div>
    
</body>
</html>
`;

  await sendEmail({ to, subject, text, isHtml: true })
    .then(() => logger.info('KYC rejection email sent successfully'))
    .catch((error) => logger.warn(`Unable to send KYC rejection email: ${error}`));
};
