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
    <td align="center">

      <!-- CONTAINER -->
      <table width="600" bgcolor="#ffffff" cellspacing="0" cellpadding="0" style="border-radius:10px; box-shadow:0 4px 8px rgba(0,0,0,0.1);">

        <!-- LOGO -->
        <tr>
          <td align="left" style="padding:20px;">
            <img src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/hapmeetlogo/68da85a84e96f5d8bc5620bb/hapmeetlogo.png"
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

            <!-- YOUCAN IMAGE (LEFT ALIGNED NOW) -->
            <img src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/youcan/69200a3daeef612118a7b86a/youcan.png"
                 width="210" height="23" alt="You Can">

            <!-- FEATURE IMAGES -->
            <img src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/findmatch/692006505559fe2c4313affc/findmatch.png" width="100%" style="margin-top:20px;">
            <img src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/MoistSecured/69200cc05559fe2c4313b005/MoistSecured.png" width="100%" style="margin-top:20px;">
            <img src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/chatprivacy/692006085559fe2c4313aff9/chatprivacy.png" width="100%" style="margin-top:20px;">
            <img src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/shop/69200d005559fe2c4313b008/shop.png" width="100%" style="margin-top:20px;">
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

        <!-- SOCIAL MEDIA ICONS (SMALL SIZE 20PX + CENTERED) -->
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0">
              <tr>

                <td style="padding:0 8px;">
                  <a href="https://www.youtube.com/@hapmeet" target="_blank">
                    <img src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/yticone/671777d63e6cb9ad5f202b0d/yt.jpg"
                         width="22" height="20" alt="YouTube">
                  </a>
                </td>

                <td style="padding:0 8px;">
                  <a href="https://www.facebook.com/profile.php?id=100094066146720" target="_blank">
                    <img src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/fbicone/671776dc3e6cb9ad5f202b01/fb.jpg"
                         width="18" height="17" alt="Facebook">
                  </a>
                </td>

                <td style="padding:0 8px;">
                  <a href="https://www.instagram.com/hapmeet/" target="_blank">
                    <img src="https://happymilan-user-images.s3.ap-south-1.amazonaws.com/name/instagramicone/671777513e6cb9ad5f202b05/insta.jpg"
                         width="20" height="20" alt="Instagram">
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

      default:
        return `<p>Hello ${name}</p>`;
    }
  },
};
