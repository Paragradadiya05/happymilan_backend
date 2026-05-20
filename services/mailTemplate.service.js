// eslint-disable-next-line import/prefer-default-export
export const mailTemplateService = {
  getTemplate(type, name) {
    switch (type) {
      case 'signUpTemplate':
        return `
<!DOCTYPE html>
<!DOCTYPE html>
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Invitation Email</title>

<style>
  body {
    margin: 0;
    padding: 0;
    background-color: #f0f4f9;
    font-family: 'Poppins', Arial, sans-serif;
  }
  img {
    display: block;
    border: 0;
  }
  p {
    margin: 0;
    padding: 0;
    color: black;
    font-size: 14px;
    line-height: 22px;
  }
</style>
</head>

<body>

<!-- WRAPPER -->
<table width="100%" bgcolor="#f0f4f9" cellspacing="0" cellpadding="0">
  <tr>
    <!-- ADDED TOP & BOTTOM SPACE -->
    <td align="center" style="padding:40px 0;">

      <!-- CONTAINER -->
      <table width="600" bgcolor="#ffffff" cellspacing="0" cellpadding="0" style="border-radius:10px; box-shadow:0 4px 8px rgba(0,0,0,0.1);">

        <!-- LOGO -->
        <tr>
          <td align="left" style="padding:40px 20px 25px 25px;">
            <img src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/hapmeet_logo/6a0d40c2e3bb1a7796d70239/hapmeet.jpg"
                 width="150" height="30" alt="Hapmeet Logo"/>
          </td>
        </tr>

        <!-- CONTENT -->
        <tr>
          <td style="padding: 0 25px;">

            <p>Hi ${name},</p><br/>

            <p>
              We're thrilled to invite you to Hapmeet, a new-age social platform designed to help you
              connect, meet, and build meaningful relationships with people nearby.
            </p><br/>

            <!-- YOUCAN IMAGE -->
            <img src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/youcan/69200a3daeef612118a7b86a/youcan.png"
                 alt="You Can">

            <!-- FEATURE IMAGES -->
            <a href="https://www.hapmeet.com/" target="_blank" style="display:block;"> <img src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/findmatch/692006505559fe2c4313affc/findmatch.png" width="100%" style="margin-top:20px;"></a>
            <a href="https://www.hapmeet.com/" target="_blank" style="display:block;"> <img src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/MoistSecured/69200cc05559fe2c4313b005/MoistSecured.png" width="100%" style="margin-top:20px;"></a>
            <a href="https://www.hapmeet.com/" target="_blank" style="display:block;"> <img src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/chatprivacy/692006085559fe2c4313aff9/chatprivacy.png" width="100%" style="margin-top:20px;"></a>
            <a href="https://www.hapmeet.com/" target="_blank" style="display:block;"> <img src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/shop/69200d005559fe2c4313b008/shop.png" width="100%" style="margin-top:20px;"></a>

            <a href="https://www.hapmeet.com/" target="_blank" style="display:block;">
              <img src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/signup/692006f55559fe2c4313b002/signup.png"
                  width="100%" style="margin-top:20px;" alt="Signup">
            </a>

            <br><br>
            <p style="text-align:center;">
              Welcome to Hapmeet, your hub for finding a life partner, dating, and friendships.
              Join us and connect with a vibrant community.
            </p>

          </td>
        </tr>

        <tr><td style="height:25px;"></td></tr>

        <!-- SOCIAL ICONS -->
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0">
              <tr>

                <td style="padding:0 8px;">
                  <a href="https://www.youtube.com/@hapmeet" target="_blank">
                    <img src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/youtube_icon/6a0d418ee3bb1a7796d7023c/youtube_icon.jpg"
                         alt="YouTube">
                  </a>
                </td>

                <td style="padding:0 8px;">
                  <a href="https://www.facebook.com/profile.php?id=100094066146720" target="_blank">
                    <img src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/facebook_icon/6a0d41dbe3bb1a7796d70287/facebook_icon.jpg"
                          alt="Facebook">
                  </a>
                </td>

                <td style="padding:0 8px;">
                  <a href="https://www.instagram.com/hapmeet/" target="_blank">
                    <img src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/instagram_icon/6a0d421ee3bb1a7796d70331/instagram_icon.jpg"
                         alt="Instagram">
                  </a>
                </td>

              </tr>
            </table>
          </td>
        </tr>

        <!-- BORDER -->
        <tr>
          <td>
            <hr style="border:0; border-top:1px solid black; margin:25px 0;">
          </td>
        </tr>

        <!-- UNSUBSCRIBE -->
        <tr>
          <td align="center" style="padding:0 0 30px 0;">
            <p style="font-size:12px;">
              If you prefer not to receive these emails, click 
              <a href="#" style="color:#0F52BA;">unsubscribe</a>.
            </p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>



`;

      case 'offerTemplate':
        return `
          <h2>Hello ${name}</h2>
          <p>New Discounts Available 🔥 Hurry Up!</p>
        `;

      case 'reminderTemplate':
        return `
          <h2>Hi ${name}</h2>
          <p>This is a gentle reminder for your pending actions.</p>
        `;
      case 'reUploadImagesTemplate':
        return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>

<title>Hapmeet Email</title>

<style>

body{
    margin:0;
    padding:0;
    background:#f5f5f5;
    font-family: Arial, Helvetica, sans-serif;
}

table{
    border-spacing:0;
}

img{
    border:0;
    display:block;
}

.main{
    width:100%;
    background:#f5f5f5;
    padding:40px 12px;
}

.container{
    max-width:1200px;
    margin:0 auto;
    background:#EEF2F7;
    border-radius:10px;
    padding:55px 20px 40px;
}

.card{
    max-width:720px;
    margin:0 auto;
    background:#ffffff;
    border-radius:22px;
    padding:45px 42px;
}

.logo{
    width:160px;
}

.content{
    padding-top:34px;
}

.text{
    font-size:16px;
    line-height:38px;
    color:#202020;
    font-weight:400;
    margin:0;
}

.bold{
    font-weight:500;
}

.footer-text{
    max-width:760px;
    margin:28px auto 0;
    text-align:center;
    color:#2d2d2d;
    font-size:12px;
    line-height:22px;
    font-weight:400;
}

.social{
    text-align:center;
    padding-top:28px;
}

.social img{
    display:inline-block;
    vertical-align:middle;
    margin:0 18px;
}

.line{
    max-width:720px;
    margin:28px auto 0;
    border-top:1px solid #d8d8d8;
}

.unsubscribe{
    text-align:center;
    padding-top:26px;
    color:#555;
    font-size:12px;
    line-height:20px;
}

.unsubscribe span{
    color:#3B82F6;
}

/* MOBILE */

@media only screen and (max-width:600px){

.main{
    padding:0 !important;
}

.container{
    padding:24px 12px 28px !important;
    border-radius:0 !important;
}

.card{
    padding:28px 22px !important;
    border-radius:18px !important;
}

.logo{
    width:140px !important;
}

.text{
    font-size:15px !important;
    line-height:31px !important;
}

.footer-text{
    font-size:13px !important;
    line-height:24px !important;
    padding-left:10px;
    padding-right:10px;
}

.social img{
    margin:0 12px !important;
}

}

</style>
</head>

<body>

<div class="main">

<div class="container">

<div class="card">

<img
class="logo"
src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/hapmeet_logo/6a0d40c2e3bb1a7796d70239/hapmeet.jpg"
alt="Hapmeet"
/>

<div class="content">

<p class="text">
Dear Hapmeet User,
</p>

<p class="text" style="margin-top:18px;">
Thank you for registering with Hapmeet.
</p>

<p
class="text bold"
style="margin-top:18px;"
>
Due to a temporary server issue, some images were not saved correctly.
Please re-upload your images at your convenience.
We sincerely apologize for the inconvenience.
</p>

<p
class="text"
style="margin-top:18px;"
>
Thank you for your understanding and continued support.
We are committed to serving you better every day.
</p>

<p
class="text"
style="margin-top:28px;"
>
Best regards,<br/>
Hapmeet Support Team
</p>

</div>

</div>

<div class="footer-text">

Welcome to Hapmeet your hub for finding a life partner,
exploring dating opportunities, and making new friends.
Join us to connect with a vibrant community and discover meaningful relationships.

</div>

<div class="social">

<a href="https://www.youtube.com/@hapmeet">
<img
src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/youtube_icon/6a0d418ee3bb1a7796d7023c/youtube_icon.jpg"
width="30"
/>
</a>

<a href="https://www.facebook.com/profile.php?id=100094066146720">
<img
src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/facebook_icon/6a0d41dbe3bb1a7796d70287/facebook_icon.jpg"
width="12"
/>
</a>

<a href="https://www.instagram.com/hapmeet/">
<img
src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/instagram_icon/6a0d421ee3bb1a7796d70331/instagram_icon.jpg"
width="22"
/>
</a>

<img
src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/Twitter_icon/6a0d468ee3bb1a7796d705a9/Twitter_icon.jpg"
width="24"
/>

</div>

<div class="line"></div>

<div class="unsubscribe">

If you prefer not to receive these emails in the future,
please <span>unsubscribe</span> here.

</div>

</div>

</div>

</body>
</html>
`;
      default:
        return `<p>Hello ${name}</p>`;
    }
  },
};
