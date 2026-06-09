// eslint-disable-next-line import/prefer-default-export
export const mailTemplateService = {
  getTemplate(type, name) {
    switch (type) {
      case 'signUpTemplate':
        return `
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
</html>`;

      case 'Partnership Opportunity with Hapmeet':
        return `
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Partnership Opportunity with Hapmeet</title>
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
            height: 30px;
           
            
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
            margin-left: 40%;
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
           height: 30px;
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
            width:35%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-left: 30%;
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
           height: 22px;
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
            margin-left: 20%;
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
            
                <img id="logo-img" src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/hapmeet_logo/6a0d40c2e3bb1a7796d70239/hapmeet.jpg" alt="Logo"/>
               </div>
            <div id="content">
                <p id="text-1">Dear  ${name},</p>
                <p id="text-1">I hope you are doing well. </p>
                <p>I am reaching out from Hapmeet.com, a platform for matrimony, build connections (Dating), and wedding & event vendors. We would like to explore a partnership with your matrimony agency.</p>
                <p id="text-1">By referring users to Hapmeet through a unique referral link or code, your agency can earn a commission on verified registrations or premium memberships.</p>
                <p id="text-1">If you're interested, we'd be happy to schedule a quick call to discuss the opportunity. </p>
                <p id="text-4">Best Regards,<br/> Hapmeet.com</p>
                 <a href="https://www.hapmeet.com/" target="_blank" rel="noopener noreferrer">
                <div id="mar-top">
                    <img id="demo" src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/vendor/6a27f32c8794edc5e56ff3b9/vendor.jpg" alt="Feature Image"/>
                </div>   
                   </a>        
                <p id="text-2">Welcome to Hapmeet, your hub for finding a life partner, exploring dating opportunities, and making new friends. Join us to connect with a vibrant community and discover meaningful relationships.</p>
            </div>
          
            <div id="content">
        <div id="div-center">
       <div id="socialmedia-div" >
                     <div>
            <a href="https://www.youtube.com/@hapmeet" target="_blank" rel="noopener noreferrer">
              <img
                id="socialmedia-1"
                src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/youtube_icon/6a0d418ee3bb1a7796d7023c/youtube_icon.jpg"
                alt="YouTube - Hapmeet"
              />
            </a>
           </div>

            <div>
            <a href="https://www.facebook.com/profile.php?id=100094066146720" target="_blank" rel="noopener noreferrer">
              <img
                id="socialmedia-2"
                src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/facebook_icon/6a0d41dbe3bb1a7796d70287/facebook_icon.jpg"
                alt="Facebook - Hapmeet"
              />
            </a>
           </div>

           <div>
            <a href="https://www.instagram.com/hapmeet/" target="_blank" rel="noopener noreferrer">
              <img
                id="socialmedia-3"
                src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/instagram_icon/6a0d421ee3bb1a7796d70331/instagram_icon.jpg"
                alt="Instagram - Hapmeet"
              />
            </a>
           </div>
           <div>
<!--            <img id="socialmedia-4" src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/Twitter_icon/6a0d468ee3bb1a7796d705a9/Twitter_icon.jpg" alt="twitter"/>-->
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
</html> `;

      case 'Become a Trusted Vendor on Hapmeet':
        return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Become a Trusted Vendor on Hapmeet</title>
</head>

<body style="margin:0;padding:0;background:#eef2f7;font-family:Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef2f7;padding:40px 0;">
<tr>
<td align="center">

<table width="800" cellpadding="0" cellspacing="0" border="0" style="max-width:800px;width:100%;">

<!-- WHITE CARD -->
<tr>
<td style="background:#ffffff;border-radius:20px;padding:40px;">

<img
src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/hapmeet_logo/6a0d40c2e3bb1a7796d70239/hapmeet.jpg"
alt="Hapmeet"
style="height:40px;margin-bottom:30px;"
>

<p style="font-size:18px;color:#333;margin-bottom:25px;">
Dear ${name},
</p>

<p style="font-size:16px;line-height:28px;color:#444;">
We would like to invite you to join Hapmeet, a growing platform that connects users with trusted wedding and event vendors.
</p>

<p style="font-size:18px;font-weight:bold;color:#222;margin-top:25px;">
By becoming a Hapmeet vendor, you can:
</p>

<ul style="padding-left:20px;color:#444;line-height:30px;font-size:16px;">
<li>Reach more potential customers</li>
<li>Increase your online visibility</li>
<li>Receive qualified inquiries for your services</li>
<li>Showcase your business to a targeted audience</li>
</ul>

<p style="font-size:16px;line-height:28px;color:#444;">
Whether you provide photography, catering, decoration, venue, makeup,
entertainment, or other event services, Hapmeet can help you reach more
customers and grow your business.
</p>

<p style="font-size:16px;line-height:28px;color:#444;">
Interested? Simply reply to this email, and we'll be happy to assist you with onboarding.
</p>

<p style="font-size:16px;line-height:28px;color:#444;">
We look forward to partnering with you.
</p>

<p style="font-size:16px;font-weight:bold;color:#222;">
Regards,<br>
Hapmeet.com
</p>

</td>
</tr>

<!-- GAP -->
<tr>
<td height="20"></td>
</tr>

<!-- PURPLE SECTION -->
<a href="https://www.hapmeet.com/" target="_blank" rel="noopener noreferrer">
 <div id="mar-top">
                <img id="demo" src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/vendor/6a27f7088794edc5e56ff3bc/vendor-2.jpg" alt="Feature Image"/>
 </div>  
 </a>
<!-- FOOTER -->
<tr>
<td align="center" style="padding:30px 20px;">

<p style="
font-size:14px;
line-height:24px;
color:#555;
max-width:700px;
margin:auto;
">
Welcome to Hapmeet your hub for finding a life partner, exploring dating opportunities,
and making new friends. Join us to connect with a vibrant community and discover
meaningful relationships.
</p>

<table cellpadding="0" cellspacing="0" style="margin-top:25px;">
<tr>

<td style="padding:0 15px;">
<a href="https://www.youtube.com/@hapmeet">
<img
src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/youtube_icon/6a0d418ee3bb1a7796d7023c/youtube_icon.jpg"
width="28"
alt="YouTube">
</a>
</td>

<td style="padding:0 15px;">
<a href="https://www.facebook.com/profile.php?id=100094066146720">
<img
src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/facebook_icon/6a0d41dbe3bb1a7796d70287/facebook_icon.jpg"
width="12"
alt="Facebook">
</a>
</td>

<td style="padding:0 15px;">
<a href="https://www.instagram.com/hapmeet/">
<img
src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/instagram_icon/6a0d421ee3bb1a7796d70331/instagram_icon.jpg"
width="24"
alt="Instagram">
</a>
</td>

</tr>
</table>

<hr style="
margin:30px 0;
border:none;
border-top:1px solid #dcdcdc;
">

<p style="
font-size:12px;
color:#666;
">
If you prefer not to receive these emails in the future, please
<a href="#" style="color:#4d6bff;text-decoration:none;">
unsubscribe
</a>
here.
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>`;
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
      -webkit-font-smoothing: antialiased;
    }

    table{
      border-spacing:0;
    }

    img{
      border:0;
      display:block;
    }

    p{
      margin:0;
      padding:0;
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
      box-sizing:border-box;
    }

    .logo{
      width:160px;
    }

    .content{
      padding-top:34px;
    }

    .text{
      font-size:16px;
      line-height:1.6; /* FIXED EXTRA SPACE */
      color:#202020;
      font-weight:400;
      margin:0;
      padding:0;
    }

    .bold{
      font-weight:500;
    }

    .space{
      margin-top:18px;
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

    .social a{
      text-decoration:none;
      display:inline-block;
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
        line-height:1.6 !important;
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
             Dear ${name || 'User'},
          </p>

          <p class="text space">
            Thank you for registering with Hapmeet.
          </p>

          <p class="text bold space">
            Due to a temporary server issue, some images were not saved correctly.
            Please re-upload your images at your convenience. We sincerely apologize
            for the inconvenience.
          </p>

          <p class="text space">
            Thank you for your understanding and continued support.
            We are committed to serving you better every day.
          </p>

          <p class="text" style="margin-top:28px;">
            Best regards,<br>
            Hapmeet Support Team
          </p>

        </div>
      </div>

      <div class="footer-text">
        Welcome to Hapmeet your hub for finding a life partner,
        exploring dating opportunities, and making new friends.
        Join us to connect with a vibrant community and discover
        meaningful relationships.
      </div>

      <div class="social">

        <a href="https://www.youtube.com/@hapmeet">
          <img
            src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/youtube_icon/6a0d418ee3bb1a7796d7023c/youtube_icon.jpg"
            width="30"
            alt="Youtube"
          />
        </a>

        <a href="https://www.facebook.com/profile.php?id=100094066146720">
          <img
            src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/facebook_icon/6a0d41dbe3bb1a7796d70287/facebook_icon.jpg"
            width="12"
            alt="Facebook"
          />
        </a>

        <a href="https://www.instagram.com/hapmeet/">
          <img
            src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/instagram_icon/6a0d421ee3bb1a7796d70331/instagram_icon.jpg"
            width="22"
            alt="Instagram"
          />
        </a>

        <a href="#">
          <img
            src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/Twitter_icon/6a0d468ee3bb1a7796d705a9/Twitter_icon.jpg"
            width="24"
            alt="Twitter"
          />
        </a>

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
      case 'Discover Nearby Event Vendors on Hapmeet':
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
      -webkit-font-smoothing: antialiased;
    }

    table{
      border-spacing:0;
    }

    img{
      border:0;
      display:block;
    }

    p{
      margin:0;
      padding:0;
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
      grid-place-items:center;
    }

    .card{
      max-width:720px;
      margin:0 auto;
      background:#ffffff;
      border-radius:22px;
      padding:45px 42px;
      box-sizing:border-box;
    }

    .logo{
      width:160px;
    }

    .content{
      padding-top:34px;
    }

    .text{
      font-size:16px;
      line-height:1.6; /* FIXED EXTRA SPACE */
      color:#202020;
      font-weight:400;
      margin:0;
      padding:0;
    }

    .bold{
      font-weight:500;
    }

    .space{
      margin-top:18px;
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

    .social a{
      text-decoration:none;
      display:inline-block;
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
        line-height:1.6 !important;
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

   <div class="content">
    <div style="text-align:center;">
        <img
            id="demo"
            src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/KycDoc/vendors/6a1d71da84ce4fc290416f39/vendors.jpg"
            alt="Feature Image"
            style="
                display:inline-block;
                max-width:100%;
                height:auto;
                margin:0 auto;
            "
        />
    </div>
</div>
      <div class="footer-text">
        Welcome to Hapmeet your hub for finding a life partner,
        exploring dating opportunities, and making new friends.
        Join us to connect with a vibrant community and discover
        meaningful relationships.
      </div>
      <div class="social">
        <a href="https://www.youtube.com/@hapmeet">
          <img
            src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/youtube_icon/6a0d418ee3bb1a7796d7023c/youtube_icon.jpg"
            width="30"
            alt="Youtube"
          />
        </a>

        <a href="https://www.facebook.com/profile.php?id=100094066146720">
          <img
            src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/facebook_icon/6a0d41dbe3bb1a7796d70287/facebook_icon.jpg"
            width="12"
            alt="Facebook"
          />
        </a>

        <a href="https://www.instagram.com/hapmeet/">
          <img
            src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/instagram_icon/6a0d421ee3bb1a7796d70331/instagram_icon.jpg"
            width="22"
            alt="Instagram"
          />
        </a>

        <a href="#">
          <img
            src="https://hapmeet-user-images-712789089772-ap-south-1-an.s3.ap-south-1.amazonaws.com/name/Twitter_icon/6a0d468ee3bb1a7796d705a9/Twitter_icon.jpg"
            width="24"
            alt="Twitter"
          />
        </a>

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
