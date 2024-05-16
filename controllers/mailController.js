const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const otpCache = require('../utils/cache');
const Mailgun = require('mailgun-js');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const api_key = process.env.MAILGUN_API_KEY;

dotenv.config();
dotenv.config({ path: './.env' });

const domain = 'support.engagegpt.in';
var from_who = 'engagegpt@gmail.com';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many requests, please try again later',
});

exports.sendMailtoUser = [
  limiter,
  async (req, res) => {
    var mailgun = new Mailgun({ apiKey: api_key, domain: domain });
    var data = {
      from: from_who,
      to: req.params.mail,
      cc: 'letsbunktoday@gmail.com',
      subject: 'Welcome to EngageGPT Waitlist',
      html: `<!DOCTYPE html>
      <html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
      
      <head>
        <title></title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0"><!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]--><!--[if !mso]><!-->
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900" rel="stylesheet" type="text/css"><!--<![endif]-->
        <style>
          * {
            box-sizing: border-box;
          }
      
          body {
            margin: 0;
            padding: 0;
          }
      
          a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: inherit !important;
          }
      
          #MessageViewBody a {
            color: inherit;
            text-decoration: none;
          }
      
          p {
            line-height: inherit
          }
      
          .desktop_hide,
          .desktop_hide table {
            mso-hide: all;
            display: none;
            max-height: 0px;
            overflow: hidden;
          }
      
          .image_block img+div {
            display: none;
          }
      
          @media (max-width:500px) {
            .desktop_hide table.icons-inner {
              display: inline-block !important;
            }
      
            .icons-inner {
              text-align: center;
            }
      
            .icons-inner td {
              margin: 0 auto;
            }
      
            .mobile_hide {
              display: none;
            }
      
            .row-content {
              width: 100% !important;
            }
      
            .stack .column {
              width: 100%;
              display: block;
            }
      
            .mobile_hide {
              min-height: 0;
              max-height: 0;
              max-width: 0;
              overflow: hidden;
              font-size: 0px;
            }
      
            .desktop_hide,
            .desktop_hide table {
              display: table !important;
              max-height: none !important;
            }
      
            .row-1 .column-1 .block-2.paragraph_block td.pad>div {
              font-size: 34px !important;
            }
      
            .row-1 .column-1 .block-3.paragraph_block td.pad>div {
              font-size: 18px !important;
            }
          }
        </style>
      </head>
      
      <body style="margin: 0; background-color: #f9f9f9; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
        <table class="nl-container" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-size: auto; background-color: #f9f9f9; background-image: none; background-position: top left; background-repeat: no-repeat;">
          <tbody>
            <tr>
              <td>
                <table class="row row-1" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f9f9f9; background-size: auto;">
                  <tbody>
                    <tr>
                      <td>
                        <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; background-size: auto; color: #000000; width: 480px; margin: 0 auto;" width="480">
                          <tbody>
                            <tr>
                              <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; background-color: #ffffff; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                <table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                  <tr>
                                    <td class="pad" style="padding-top:25px;width:100%;padding-right:0px;padding-left:0px;">
                                      <div class="alignment" align="center" style="line-height:10px">
                                        <div style="max-width: 240px;"><img src="https://d1oco4z2z1fhwp.cloudfront.net/templates/default/1561/Welcome_Email.png" style="display: block; height: auto; border: 0; width: 100%;" width="240" alt="welcome image" title="welcome image" height="auto"></div>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                                <table class="paragraph_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                  <tr>
                                    <td class="pad" style="padding-bottom:10px;padding-left:40px;padding-right:40px;padding-top:10px;">
                                      <div style="color:#191919;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:38px;line-height:150%;text-align:center;mso-line-height-alt:57px;">
                                        <p style="margin: 0; word-break: break-word;"><strong><span>Welcome to EngageGPT!</span></strong></p>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                                <table class="paragraph_block block-3" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                  <tr>
                                    <td class="pad">
                                      <div style="color:#191919;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:22px;line-height:120%;text-align:center;mso-line-height-alt:26.4px;">
                                        <p style="margin: 0; word-break: break-word;"><span>Thank you for joining!</span></p>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table class="row row-2" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f9f9f9;">
                  <tbody>
                    <tr>
                      <td>
                        <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 480px; margin: 0 auto;" width="480">
                          <tbody>
                            <tr>
                              <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; background-color: #ffffff; padding-bottom: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                <table class="divider_block block-1" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                  <tr>
                                    <td class="pad">
                                      <div class="alignment" align="center">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                          <tr>
                                            <td class="divider_inner" style="font-size: 1px; line-height: 1px; border-top: 1px solid #BBBBBB;"><span>&#8202;</span></td>
                                          </tr>
                                        </table>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                                <table class="divider_block block-2" width="100%" border="0" cellpadding="5" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                  <tr>
                                    <td class="pad">
                                      <div class="alignment" align="center">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="15%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                          <tr>
                                            <td class="divider_inner" style="font-size: 1px; line-height: 1px; border-top: 2px solid #FFD3E0;"><span>&#8202;</span></td>
                                          </tr>
                                        </table>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                                <table class="paragraph_block block-3" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                  <tr>
                                    <td class="pad">
                                      <div style="color:#444a5b;direction:ltr;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:16px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:center;mso-line-height-alt:19.2px;">
                                        <p style="margin: 0; margin-bottom: 16px;"><strong>Key Features to Look Forward To:</strong></p>
                                        <p style="margin: 0; margin-bottom: 16px;">AI-powered comment generation</p>
                                        <p style="margin: 0; margin-bottom: 16px;">Seamless message templates</p>
                                        <p style="margin: 0; margin-bottom: 16px;">Enhanced post content creation</p>
                                        <p style="margin: 0;">And much more!</p>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                                <table class="divider_block block-4" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                  <tr>
                                    <td class="pad">
                                      <div class="alignment" align="center">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="5%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                          <tr>
                                            <td class="divider_inner" style="font-size: 1px; line-height: 1px; border-top: 2px solid #FFD3E0;"><span>&#8202;</span></td>
                                          </tr>
                                        </table>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                                <table class="paragraph_block block-5" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                  <tr>
                                    <td class="pad" style="padding-left:20px;padding-right:20px;padding-top:30px;">
                                      <div style="color:#191919;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:28px;font-weight:400;line-height:150%;text-align:center;mso-line-height-alt:42px;">
                                        <p style="margin: 0;">What's Next?</p>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                                <table class="paragraph_block block-6" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                  <tr>
                                    <td class="pad" style="padding-bottom:10px;padding-left:40px;padding-right:30px;padding-top:30px;">
                                      <div style="color:#555555;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:14px;line-height:200%;text-align:center;mso-line-height-alt:28px;">
                                        <p style="margin: 0; word-break: break-word;">You're now on our waitlist, and we'll notify you as soon as access becomes available.&nbsp; Explore our website and learn more about EngageGPT's features and capabilities..</p>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                                <table class="button_block block-7" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                  <tr>
                                    <td class="pad">
                                      <div class="alignment" align="center"><!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://engage-gpt-y2ne.vercel.app" style="height:42px;width:148px;v-text-anchor:middle;" arcsize="79%" stroke="false" fillcolor="#21007a">
      <w:anchorlock/>
      <v:textbox inset="0px,0px,0px,0px">
      <center style="color:#ffffff; font-family:Tahoma, sans-serif; font-size:16px">
      <![endif]--><a href="https://engage-gpt-y2ne.vercel.app" target="_blank" style="text-decoration:none;display:inline-block;color:#ffffff;background-color:#21007a;border-radius:33px;width:auto;border-top:0px solid transparent;font-weight:400;border-right:0px solid transparent;border-bottom:0px solid transparent;border-left:0px solid transparent;padding-top:5px;padding-bottom:5px;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:16px;text-align:center;mso-border-alt:none;word-break:keep-all;"><span style="padding-left:20px;padding-right:20px;font-size:16px;display:inline-block;letter-spacing:normal;"><span style="word-break: break-word; line-height: 32px;">Invite Friends</span></span></a><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></div>
                                    </td>
                                  </tr>
                                </table>
                                <table class="button_block block-8" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                  <tr>
                                    <td class="pad">
                                      <div class="alignment" align="center"><!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://engage-gpt-y2ne.vercel.app" style="height:47px;width:145px;v-text-anchor:middle;" arcsize="77%" strokeweight="0.75pt" strokecolor="#000000" fillcolor="#f9f9f9">
      <w:anchorlock/>
      <v:textbox inset="0px,0px,0px,0px">
      <center style="color:#000000; font-family:Tahoma, sans-serif; font-size:16px">
      <![endif]--><a href="https://engage-gpt-y2ne.vercel.app" target="_blank" style="text-decoration:none;display:inline-block;color:#000000;background-color:#f9f9f9;border-radius:33px;width:auto;border-top:1px solid #000000;font-weight:400;border-right:1px solid #000000;border-bottom:1px solid #000000;border-left:1px solid #000000;padding-top:5px;padding-bottom:5px;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:16px;text-align:center;mso-border-alt:none;word-break:keep-all;"><span style="padding-left:20px;padding-right:20px;font-size:16px;display:inline-block;letter-spacing:normal;"><span style="word-break: break-word; line-height: 32px;">Our Website</span></span></a><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table class="row row-3" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                  <tbody>
                    <tr>
                      <td>
                        <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 480px; margin: 0 auto;" width="480">
                          <tbody>
                            <tr>
                              <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                <div class="spacer_block block-1" style="height:35px;line-height:35px;font-size:1px;">&#8202;</div>
                                <table class="paragraph_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                  <tr>
                                    <td class="pad" style="padding-bottom:10px;">
                                      <div style="color:#34495e;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:20px;line-height:200%;text-align:center;mso-line-height-alt:40px;">
                                        <p style="margin: 0;">Get Support</p>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                                <table class="paragraph_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                  <tr>
                                    <td class="pad" style="padding-bottom:10px;padding-left:40px;padding-right:30px;">
                                      <div style="color:#555555;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:14px;line-height:200%;text-align:center;mso-line-height-alt:28px;">
                                        <p style="margin: 0;">If you have any questions or need assistance, don't hesitate to reach out to our support team at <strong><a target="_new" rel="noreferrer" style="text-decoration: underline; color: #555555;">engagegpt@gmail.com</a></strong></p>
                                        <p style="margin: 0;">&nbsp;</p>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table class="row row-4" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f9f9f9; background-size: auto;">
                  <tbody>
                    <tr>
                      <td>
                        <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; background-size: auto; color: #000000; width: 480px; margin: 0 auto;" width="480">
                          <tbody>
                            <tr>
                              <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                <div class="spacer_block block-1" style="height:25px;line-height:25px;font-size:1px;">&#8202;</div>
                                <table class="paragraph_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                  <tr>
                                    <td class="pad" style="padding-bottom:10px;padding-left:40px;padding-right:40px;">
                                      <div style="color:#555555;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:14px;line-height:200%;text-align:center;mso-line-height-alt:28px;">
                                        <p style="margin: 0;"><strong>Thank you again for joining the EngageGPT Waitlist! We can't wait to help you enhance your LinkedIn experience with AI-powered engagement tools.</strong></p>
                                        <p style="margin: 0;">&nbsp;</p>
                                        <p style="margin: 0;">Best regards,</p>
                                        <p style="margin: 0;">The EngageGPT Team</p>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                                <table class="image_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                  <tr>
                                    <td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
                                      <div class="alignment" align="center" style="line-height:10px">
                                        <div style="max-width: 192px;"><img src="https://703f5c306b.imgdist.com/pub/bfra/dw1bjt8l/lvp/w9m/y4b/EngageGPTLogo.png" style="display: block; height: auto; border: 0; width: 100%;" width="192" height="auto"></div>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table class="row row-5" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f9f9f9;">
                  <tbody>
                    <tr>
                      <td>
                        <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 480px; margin: 0 auto;" width="480">
                          <tbody>
                            <tr>
                              <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                <div class="spacer_block block-1" style="height:25px;line-height:25px;font-size:1px;">&#8202;</div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table class="row row-6" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;">
                  <tbody>
                    <tr>
                      <td>
                        <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 480px; margin: 0 auto;" width="480">
                          <tbody>
                            <tr>
                              <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
 
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table><!-- End -->
      </body>
      
      </html>`,
    };
    mailgun.messages().send(data, function (err, body) {
      if (err) {
        res.status(500).send({ error: 'Error sending email' });
      } else {
        res.status(200).send({ message: 'Email sent successfully' });
      }
    });
  },
];

const generateOTP = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let otp = '';
  for (let i = 0; i < 6; i++) {
    otp += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return otp;
};

const rateLimitOpts = {
  points: 20, // 20 request
  duration: 60, // per 60 seconds
};

const rateLimiter = new RateLimiterMemory(rateLimitOpts);

const rateLimitMiddleware = async (req, res, next) => {
  try {
    const email = req.params.email;
    // Consume a point from the user's rate limiter
    await rateLimiter.consume(email);
    next();
  } catch (err) {
    // If the user has exceeded the limit, send an error response
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
    });
  }
};

exports.sendOTPtoUser = [
  rateLimitMiddleware,
  async (req, res) => {
    const email = req.params.mail;
    const OTP = generateOTP();

    otpCache.set(email, {
      otp: OTP,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    var mailgun = new Mailgun({ apiKey: api_key, domain: domain });
    var data = {
      from: from_who,
      to: req.params.mail,
      subject: 'Verify Email Address',
      html: `<!DOCTYPE html>
    <html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
    
    <head>
      <title>Verify OTP</title>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0"><!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]--><!--[if !mso]><!-->
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900" rel="stylesheet" type="text/css"><!--<![endif]-->
      <style>
        * {
          box-sizing: border-box;
        }
    
        body {
          margin: 0;
          padding: 0;
        }
    
        a[x-apple-data-detectors] {
          color: inherit !important;
          text-decoration: inherit !important;
        }
    
        #MessageViewBody a {
          color: inherit;
          text-decoration: none;
        }
    
        p {
          line-height: inherit
        }
    
        .desktop_hide,
        .desktop_hide table {
          mso-hide: all;
          display: none;
          max-height: 0px;
          overflow: hidden;
        }
    
        .image_block img+div {
          display: none;
        }
    
        @media (max-width:570px) {
          .desktop_hide table.icons-inner {
            display: inline-block !important;
          }
    
          .icons-inner {
            text-align: center;
          }
    
          .icons-inner td {
            margin: 0 auto;
          }
    
          .mobile_hide {
            display: none;
          }
    
          .row-content {
            width: 100% !important;
          }
    
          .stack .column {
            width: 100%;
            display: block;
          }
    
          .mobile_hide {
            min-height: 0;
            max-height: 0;
            max-width: 0;
            overflow: hidden;
            font-size: 0px;
          }
    
          .desktop_hide,
          .desktop_hide table {
            display: table !important;
            max-height: none !important;
          }
        }
      </style>
    </head>
    
    <body style="background-color: #f9f9f9; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
      <table class="nl-container" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f9f9f9;">
        <tbody>
          <tr>
            <td>
              <table class="row row-1" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f9f9f9;">
                <tbody>
                  <tr>
                    <td>
                      <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 550px; margin: 0 auto;" width="550">
                        <tbody>
                          <tr>
                            <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                              <table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                <tr>
                                  <td class="pad" style="padding-bottom:15px;padding-top:15px;width:100%;padding-right:0px;padding-left:0px;">
                                    <div class="alignment" align="center" style="line-height:10px">
                                      <div style="max-width: 220px;"><img src="https://9ffa24b4da.imgdist.com/pub/bfra/g99k8lsa/vj2/3ok/86w/EngageGPTLogo.png" style="display: block; height: auto; border: 0; width: 100%;" width="220" alt="Alternate text" title="Alternate text" height="auto"></div>
                                    </div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table class="row row-2" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                <tbody>
                  <tr>
                    <td>
                      <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 550px; margin: 0 auto;" width="550">
                        <tbody>
                          <tr>
                            <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                              <table class="paragraph_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                <tr>
                                  <td class="pad" style="padding-bottom:15px;padding-top:15px;">
                                    <div style="color:#1678ac;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:20px;line-height:180%;text-align:center;mso-line-height-alt:36px;">
                                      <p style="margin: 0;"><strong>Verify Your Email Address</strong></p>
                                    </div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table class="row row-3" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                <tbody>
                  <tr>
                    <td>
                      <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f9f9f9; color: #000000; width: 550px; margin: 0 auto;" width="550">
                        <tbody>
                          <tr>
                            <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 15px; padding-top: 15px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                              <table class="paragraph_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                <tr>
                                  <td class="pad" style="padding-bottom:10px;padding-left:25px;padding-right:10px;padding-top:10px;">
                                    <div style="color:#232323;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:12px;line-height:150%;text-align:center;mso-line-height-alt:18px;">
                                      <p style="margin: 0;">You have requested an OTP Login to your EngageGPT Account. If this was you, please input the Code below to continue.</p>
                                    </div>
                                  </td>
                                </tr>
                              </table>
                              <table class="paragraph_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                <tr>
                                  <td class="pad" style="padding-bottom:10px;padding-top:10px;">
                                    <div style="color:#232323;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:17px;line-height:120%;text-align:center;mso-line-height-alt:20.4px;">
                                      <p style="margin: 0;"><strong>OTP</strong></p>
                                    </div>
                                  </td>
                                </tr>
                              </table>
                              <table class="paragraph_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                <tr>
                                  <td class="pad" style="padding-bottom:10px;padding-top:10px;">
                                    <div style="color:#0068a5;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:32px;line-height:120%;text-align:center;mso-line-height-alt:38.4px;">
                                      <p style="margin: 0; word-break: break-word;"><strong><span>${OTP}</span></strong></p>
                                    </div>
                                  </td>
                                </tr>
                              </table>
                              <table class="paragraph_block block-4" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                <tr>
                                  <td class="pad" style="padding-bottom:20px;padding-left:25px;padding-right:10px;padding-top:20px;">
                                    <div style="color:#232323;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:14px;line-height:150%;text-align:center;mso-line-height-alt:21px;">
                                      <p style="margin: 0;">Do not share your OTP with anyone under any circumstances.</p>
                                    </div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table class="row row-4" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                <tbody>
                  <tr>
                    <td>
                      <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border-radius: 3px; color: #000000; width: 550px; margin: 0 auto;" width="550">
                        <tbody>
                          <tr>
                            <td class="column column-1" width="50%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 10px; padding-top: 10px; vertical-align: middle; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                              <table class="button_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                <tr>
                                  <td class="pad" style="padding-bottom:10px;padding-top:10px;text-align:center;">
                                    <div class="alignment" align="center"><!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://www.engagegpt.in" style="height:42px;width:138px;v-text-anchor:middle;" arcsize="70%" stroke="false" fillcolor="#0068a5">
    <w:anchorlock/>
    <v:textbox inset="5px,0px,0px,0px">
    <center style="color:#ffffff; font-family:Tahoma, sans-serif; font-size:16px">
    <![endif]--><a href="https://www.engagegpt.in" target="_blank" style="text-decoration:none;display:inline-block;color:#ffffff;background-color:#0068a5;border-radius:29px;width:auto;border-top:0px solid transparent;font-weight:undefined;border-right:0px solid transparent;border-bottom:0px solid transparent;border-left:0px solid transparent;padding-top:5px;padding-bottom:5px;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:16px;text-align:center;mso-border-alt:none;word-break:keep-all;"><span style="padding-left:20px;padding-right:15px;font-size:16px;display:inline-block;letter-spacing:normal;"><span style="word-break: break-word; line-height: 32px;">Visit Website</span></span></a><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                            <td class="column column-2" width="50%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: middle; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                              <table class="button_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                <tr>
                                  <td class="pad" style="padding-bottom:10px;padding-top:10px;text-align:center;">
                                    <div class="alignment" align="center"><!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://chromewebstore.google.com/detail/engagegpt-ai-for-linkedin/ldhdipkofibjleihomflebfklhadikio?hl=en-GB" style="height:48px;width:167px;v-text-anchor:middle;" arcsize="71%" strokeweight="0.75pt" strokecolor="#0068a5" fillcolor="#f9f9f9">
    <w:anchorlock/>
    <v:textbox inset="0px,0px,0px,0px">
    <center style="color:#0068a5; font-family:Tahoma, sans-serif; font-size:16px">
    <![endif]--><a href="https://chromewebstore.google.com/detail/engagegpt-ai-for-linkedin/ldhdipkofibjleihomflebfklhadikio?hl=en-GB" target="_blank" style="text-decoration:none;display:inline-block;color:#0068a5;background-color:#f9f9f9;border-radius:31px;width:auto;border-top:1px solid #0068a5;font-weight:undefined;border-right:1px solid #0068a5;border-bottom:1px solid #0068a5;border-left:1px solid #0068a5;padding-top:5px;padding-bottom:5px;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:16px;text-align:center;mso-border-alt:none;word-break:keep-all;"><span style="padding-left:20px;padding-right:20px;font-size:16px;display:inline-block;letter-spacing:normal;"><span style="word-break: break-word; line-height: 32px;">View Extension</span></span></a><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table class="row row-5" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f9f9f9;">
                <tbody>
                  <tr>
                    <td>
                      <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f9f9f9; color: #000000; width: 550px; margin: 0 auto;" width="550">
                        <tbody>
                          <tr>
                            <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 15px; padding-top: 15px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                              <table class="paragraph_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                <tr>
                                  <td class="pad" style="padding-bottom:10px;padding-left:25px;padding-right:10px;padding-top:10px;">
                                    <div style="color:#232323;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:14px;line-height:150%;text-align:center;mso-line-height-alt:21px;">
                                      <p style="margin: 0;">For any further queries or clarifications, feel free to reach out to us at <a href="mailto:engagegpt@gmail.com?subject=Query/Clarification&body=Enter your query here......" target="_blank" title="engagegpt@gmail.com" style="text-decoration: underline; color: #0068A5;" rel="noopener">engagegpt@gmail.com</a> or visit our website <a href="https://www.engagegpt.in" target="_blank" style="text-decoration: underline; color: #0068A5;" rel="noopener">www.engagegpt.in</a></p>
                                    </div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table class="row row-6" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                <tbody>
                  <tr>
                    <td>
                      <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 550px; margin: 0 auto;" width="550">
                        <tbody>
                          <tr>
                            <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                              <table class="paragraph_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                <tr>
                                  <td class="pad" style="padding-bottom:20px;padding-left:25px;padding-right:10px;padding-top:20px;">
                                    <div style="color:#232323;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:14px;letter-spacing:0px;line-height:150%;text-align:center;mso-line-height-alt:21px;">
                                      <p style="margin: 0; margin-bottom: 4px;"><strong>Happy Engaging</strong></p>
                                      <p style="margin: 0;"><strong>Team EngageGPT</strong></p>
                                    </div>
                                  </td>
                                </tr>
                              </table>
                              <table class="image_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                <tr>
                                  <td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
                                    <div class="alignment" align="center" style="line-height:10px">
                                      <div style="max-width: 247.5px;"><img src="https://9ffa24b4da.imgdist.com/pub/bfra/g99k8lsa/vj2/3ok/86w/EngageGPTLogo.png" style="display: block; height: auto; border: 0; width: 100%;" width="247.5" height="auto"></div>
                                    </div>
                                  </td>
                                </tr>
                              </table>
                              <table class="divider_block block-3" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                <tr>
                                  <td class="pad">
                                    <div class="alignment" align="center">
                                      <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="95%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                        <tr>
                                          <td class="divider_inner" style="font-size: 1px; line-height: 1px; border-top: 1px dashed #BBBBBB;"><span>&#8202;</span></td>
                                        </tr>
                                      </table>
                                    </div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table class="row row-7" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;">
                <tbody>
                  <tr>
                    <td>
                      <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 550px; margin: 0 auto;" width="550">
                        <tbody>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table><!-- End -->
    </body>
    
    </html>`,
    };
    mailgun.messages().send(data, function (err, body) {
      if (err) {
        res.status(500).send({ error: 'Error sending email' });
      } else {
        res.status(200).send({ message: 'Email sent successfully' });
      }
    });
  },
];

exports.sendAccess = async (req, res) => {
  var mailgun = new Mailgun({ apiKey: api_key, domain: domain });
  var data = {
    from: from_who,
    to: req.params.mail,
    cc: 'letsbunktoday@gmail.com',
    subject: 'Early Access to EngageGPT',
    html: `<!DOCTYPE html>
      <html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
      <head>
        <title></title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0"><!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]--><!--[if !mso]><!-->
        <link href="https://fonts.googleapis.com/css2?family=Fira+Sans:wght@100;200;300;400;500;600;700;800;900" rel="stylesheet" type="text/css"><!--<![endif]-->
        <style>
          * {
            box-sizing: border-box;
          }
      
          body {
            margin: 0;
            padding: 0;
          }
      
          a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: inherit !important;
          }
      
          #MessageViewBody a {
            color: inherit;
            text-decoration: none;
          }
      
          p {
            line-height: inherit
          }
      
          .desktop_hide,
          .desktop_hide table {
            mso-hide: all;
            display: none;
            max-height: 0px;
            overflow: hidden;
          }
      
          .image_block img+div {
            display: none;
          }
      
          @media (max-width:615px) {
            .desktop_hide table.icons-inner {
              display: inline-block !important;
            }
      
            .icons-inner {
              text-align: center;
            }
      
            .icons-inner td {
              margin: 0 auto;
            }
      
            .mobile_hide {
              display: none;
            }
      
            .row-content {
              width: 100% !important;
            }
      
            .stack .column {
              width: 100%;
              display: block;
            }
      
            .mobile_hide {
              min-height: 0;
              max-height: 0;
              max-width: 0;
              overflow: hidden;
              font-size: 0px;
            }
      
            .desktop_hide,
            .desktop_hide table {
              display: table !important;
              max-height: none !important;
            }
      
            .reverse {
              display: table;
              width: 100%;
            }
      
            .reverse .column.first {
              display: table-footer-group !important;
            }
      
            .reverse .column.last {
              display: table-header-group !important;
            }
      
            .row-3 td.column.first .border {
              padding: 40px 30px 30px;
              border-top: 0;
              border-right: 0px;
              border-bottom: 0;
              border-left: 0;
            }
      
            .row-3 td.column.last .border {
              padding: 5px 0;
              border-top: 0;
              border-right: 0px;
              border-bottom: 0;
              border-left: 0;
            }
      
            .row-2 .column-1 .block-1.heading_block h2,
            .row-2 .column-1 .block-2.paragraph_block td.pad>div,
            .row-5 .column-1 .block-1.heading_block h2,
            .row-5 .column-1 .block-2.paragraph_block td.pad>div {
              text-align: center !important;
            }
          }
        </style>
      </head>
      
      <body style="margin: 0; background-color: #011638; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
        <table class="nl-container" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #011638;">
          <tbody>
            <tr>
              <td>
                <table class="row row-1" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; background-size: auto;">
                  <tbody>
                    <tr>
                      <td>
                        <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-size: auto; color: #000000; width: 595px; margin: 0 auto;" width="595">
                          <tbody>
                            <tr>
                              <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                <div class="spacer_block block-1" style="height:25px;line-height:25px;font-size:1px;">&#8202;</div>
                                <table class="image_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                  <tr>
                                    <td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
                                      <div class="alignment" align="center" style="line-height:10px">
                                        <div style="max-width: 238px;"><img src="https://fceae5ec2c.imgdist.com/pub/bfra/jyy05d7s/q7p/8b5/we0/EngageGPTLogo.png" style="display: block; height: auto; border: 0; width: 100%;" width="238" height="auto"></div>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                                <table class="paragraph_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                  <tr>
                                    <td class="pad" style="padding-bottom:25px;padding-left:25px;padding-right:25px;padding-top:30px;">
                                      <div style="color:#101112;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:22px;font-weight:400;letter-spacing:0px;line-height:150%;text-align:center;mso-line-height-alt:33px;">
                                        <p style="margin: 0;"><strong>Congratulations 🎉</strong><br>You are in top 100,<br>to gain early access to EngageGPT&nbsp;</p>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table class="row row-2" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                  <tbody>
                    <tr>
                      <td>
                        <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-image: url('https://d1oco4z2z1fhwp.cloudfront.net/templates/default/8621/Group_1000006081.png'); background-repeat: no-repeat; background-size: cover; border-radius: 12px; color: #000000; width: 595px; margin: 0 auto;" width="595">
                          <tbody>
                            <tr>
                              <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 20px; padding-left: 10px; padding-right: 10px; padding-top: 30px; vertical-align: middle; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                <table class="heading_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                  <tr>
                                    <td class="pad" style="padding-left:10px;padding-right:10px;padding-top:10px;text-align:center;width:100%;">
                                      <h2 style="margin: 0; color: #ffffff; direction: ltr; font-family: 'Fira Sans', 'Lucida Sans Unicode', 'Lucida Grande', sans-serif; font-size: 32px; font-weight: 700; letter-spacing: normal; line-height: 150%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 48px;"><span class="tinyMce-placeholder">Install the extension now</span></h2>
                                    </td>
                                  </tr>
                                </table>
                                <table class="paragraph_block block-2" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                  <tr>
                                    <td class="pad">
                                      <div style="color:#d8d8f6;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:150%;text-align:center;mso-line-height-alt:21px;">
                                        <p style="margin: 0;">Click on the button below to access EngageGPT extension</p>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                                <table class="button_block block-3" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                  <tr>
                                    <td class="pad">
                                      <div class="alignment" align="center"><!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://chromewebstore.google.com/detail/engagegpt-ai-for-linkedin/ldhdipkofibjleihomflebfklhadikio?hl=en-GB" style="height:48px;width:149px;v-text-anchor:middle;" arcsize="69%" strokeweight="0.75pt" strokecolor="#746ff0" fillcolor="#ffffff">
      <w:anchorlock/>
      <v:textbox inset="0px,0px,0px,0px">
      <center style="color:#000000; font-family:Arial, sans-serif; font-size:16px">
      <![endif]--><a href="https://chromewebstore.google.com/detail/engagegpt-ai-for-linkedin/ldhdipkofibjleihomflebfklhadikio?hl=en-GB" target="_blank" style="text-decoration:none;display:inline-block;color:#000000;background-color:#ffffff;border-radius:30px;width:auto;border-top:1px solid #746ff0;font-weight:400;border-right:1px solid #746ff0;border-bottom:1px solid #746ff0;border-left:1px solid #746ff0;padding-top:5px;padding-bottom:5px;font-family:Arial, Helvetica, sans-serif;font-size:16px;text-align:center;mso-border-alt:none;word-break:keep-all;"><span style="padding-left:20px;padding-right:20px;font-size:16px;display:inline-block;letter-spacing:normal;"><span style="word-break: break-word; line-height: 32px;">Add Extension</span></span></a><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table class="row row-3" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #011638;">
                  <tbody>
                    <tr>
                      <td>
                        <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-radius: 0; color: #000000; width: 595px; margin: 0 auto;" width="595">
                          <tbody>
                            <tr class="reverse">
                              <td class="column column-1 first" width="50%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 30px; padding-left: 30px; padding-right: 30px; padding-top: 40px; vertical-align: middle; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                <div class="border">
                                  <table class="heading_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                    <tr>
                                      <td class="pad" style="text-align:center;width:100%;">
                                        <h2 style="margin: 0; color: #ffffff; direction: ltr; font-family: 'Fira Sans', 'Lucida Sans Unicode', 'Lucida Grande', sans-serif; font-size: 27px; font-weight: 700; letter-spacing: normal; line-height: 150%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 40.5px;"><span class="tinyMce-placeholder">EngageGPT Support Group</span></h2>
                                      </td>
                                    </tr>
                                  </table>
                                  <table class="paragraph_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                    <tr>
                                      <td class="pad" style="padding-bottom:10px;padding-left:5px;padding-right:5px;padding-top:10px;">
                                        <div style="color:#d8d8f6;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:16px;font-weight:400;letter-spacing:0px;line-height:150%;text-align:left;mso-line-height-alt:24px;">
                                          <p style="margin: 0;">In case u need any help u can send message to this group</p>
                                        </div>
                                      </td>
                                    </tr>
                                  </table>
                                  <table class="button_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                    <tr>
                                      <td class="pad" style="padding-bottom:10px;padding-top:10px;text-align:left;">
                                        <div class="alignment" align="left"><!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://chat.whatsapp.com/CxMeAkMmAlnBJzVg89hkST" style="height:48px;width:124px;v-text-anchor:middle;" arcsize="80%" strokeweight="0.75pt" strokecolor="#746ff0" fillcolor="#d3d1ff">
      <w:anchorlock/>
      <v:textbox inset="0px,0px,0px,0px">
      <center style="color:#000000; font-family:Arial, sans-serif; font-size:16px">
      <![endif]--><a href="https://chat.whatsapp.com/CxMeAkMmAlnBJzVg89hkST" target="_blank" style="text-decoration:none;display:inline-block;color:#000000;background-color:#d3d1ff;border-radius:35px;width:auto;border-top:1px solid #746ff0;font-weight:400;border-right:1px solid #746ff0;border-bottom:1px solid #746ff0;border-left:1px solid #746ff0;padding-top:5px;padding-bottom:5px;font-family:Arial, Helvetica, sans-serif;font-size:16px;text-align:center;mso-border-alt:none;word-break:keep-all;"><span style="padding-left:20px;padding-right:20px;font-size:16px;display:inline-block;letter-spacing:normal;"><span style="word-break: break-word; line-height: 32px;">Join Group</span></span></a><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></div>
                                      </td>
                                    </tr>
                                  </table>
                                </div>
                              </td>
                              <td class="column column-2 last" width="50%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: middle; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                <div class="border">
                                  <table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                    <tr>
                                      <td class="pad" style="padding-top:40px;width:100%;padding-right:0px;padding-left:0px;">
                                        <div class="alignment" align="center" style="line-height:10px">
                                          <div style="max-width: 297.5px;"><img src="https://fceae5ec2c.imgdist.com/pub/bfra/jyy05d7s/8yw/au8/81m/3831044-removebg-preview.png" style="display: block; height: auto; border: 0; width: 100%;" width="297.5" height="auto"></div>
                                        </div>
                                      </td>
                                    </tr>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table class="row row-4" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #011638;">
                  <tbody>
                    <tr>
                      <td>
                        <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-radius: 0; color: #000000; width: 595px; margin: 0 auto;" width="595">
                          <tbody>
                            <tr>
                              <td class="column column-1" width="50%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; background-color: #011638; padding-bottom: 40px; padding-left: 30px; padding-right: 30px; padding-top: 10px; vertical-align: middle; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                <table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                  <tr>
                                    <td class="pad" style="padding-bottom:20px;padding-top:20px;width:100%;padding-right:0px;padding-left:0px;">
                                      <div class="alignment" align="center" style="line-height:10px">
                                        <div style="max-width: 201.875px;"><img src="https://fceae5ec2c.imgdist.com/pub/bfra/jyy05d7s/fau/grq/0ws/image-removebg-preview%20%282%29.png" style="display: block; height: auto; border: 0; width: 100%;" width="201.875" height="auto"></div>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td class="column column-2" width="50%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: middle; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                <table class="heading_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                  <tr>
                                    <td class="pad" style="padding-left:30px;padding-right:30px;text-align:center;width:100%;">
                                      <h2 style="margin: 0; color: #ffffff; direction: ltr; font-family: 'Fira Sans', 'Lucida Sans Unicode', 'Lucida Grande', sans-serif; font-size: 27px; font-weight: 700; letter-spacing: normal; line-height: 150%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 40.5px;"><span class="tinyMce-placeholder">Features Tutorials</span></h2>
                                    </td>
                                  </tr>
                                </table>
                                <table class="paragraph_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                  <tr>
                                    <td class="pad" style="padding-bottom:10px;padding-left:30px;padding-right:10px;padding-top:10px;">
                                      <div style="color:#d8d8f6;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:16px;font-weight:400;letter-spacing:0px;line-height:150%;text-align:left;mso-line-height-alt:24px;">
                                        <p style="margin: 0;">Watch these tutorials to get started with EngageGPT</p>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                                <table class="button_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                  <tr>
                                    <td class="pad" style="padding-bottom:10px;padding-left:30px;padding-right:10px;padding-top:10px;text-align:left;">
                                      <div class="alignment" align="left"><!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://www.youtube.com/playlist?list=PLYHoCaYE8EoD6YBlcDrPoHSYTIvAjW3vI" style="height:48px;width:155px;v-text-anchor:middle;" arcsize="91%" strokeweight="0.75pt" strokecolor="#746ff0" fillcolor="#d3d1ff">
      <w:anchorlock/>
      <v:textbox inset="0px,0px,0px,0px">
      <center style="color:#000000; font-family:Arial, sans-serif; font-size:16px">
      <![endif]--><a href="https://www.youtube.com/playlist?list=PLYHoCaYE8EoD6YBlcDrPoHSYTIvAjW3vI" target="_blank" style="text-decoration:none;display:inline-block;color:#000000;background-color:#d3d1ff;border-radius:40px;width:auto;border-top:1px solid #746ff0;font-weight:400;border-right:1px solid #746ff0;border-bottom:1px solid #746ff0;border-left:1px solid #746ff0;padding-top:5px;padding-bottom:5px;font-family:Arial, Helvetica, sans-serif;font-size:16px;text-align:center;mso-border-alt:none;word-break:keep-all;"><span style="padding-left:20px;padding-right:20px;font-size:16px;display:inline-block;letter-spacing:normal;"><span style="word-break: break-word; line-height: 32px;">Watch Tutorials</span></span></a><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table class="row row-5" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                  <tbody>
                    <tr>
                      <td>
                        <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-image: url('https://d1oco4z2z1fhwp.cloudfront.net/templates/default/8621/Group_1000006081.png'); background-repeat: no-repeat; background-size: cover; border-radius: 12px; color: #000000; width: 595px; margin: 0 auto;" width="595">
                          <tbody>
                            <tr>
                              <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 30px; padding-left: 10px; padding-right: 10px; padding-top: 30px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                <table class="heading_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                  <tr>
                                    <td class="pad" style="padding-left:10px;padding-right:10px;padding-top:10px;text-align:center;width:100%;">
                                      <h2 style="margin: 0; color: #ffffff; direction: ltr; font-family: 'Fira Sans', 'Lucida Sans Unicode', 'Lucida Grande', sans-serif; font-size: 32px; font-weight: 700; letter-spacing: normal; line-height: 150%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 48px;"><span class="tinyMce-placeholder">Your Feedback Matters</span></h2>
                                    </td>
                                  </tr>
                                </table>
                                <table class="paragraph_block block-2" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                  <tr>
                                    <td class="pad">
                                      <div style="color:#d8d8f6;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:150%;text-align:center;mso-line-height-alt:21px;">
                                        <p style="margin: 0;">We value your opinion and would love to hear about your experience with EngageGPT</p>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                                <table class="button_block block-3" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                  <tr>
                                    <td class="pad">
                                      <div class="alignment" align="center"><!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="mailto:engagegpt@gmail.com?body=Dear%20EngageGPT%20Team%2C%0A%0AI%20hope%20this%20message%20finds%20you%20well.%20I%27m%20writing%20to%20share%20my%20feedback%20and%20suggestions%20regarding%20the%20EngageGPT%20extension.%20Your%20commitment%20to%20improving%20user%20experience%20is%20commendable%2C%20and%20I%27m%20eager%20to%20contribute%20to%20the%20enhancement%20of%20the%20platform.%0A%0AFeedback%20Details%3A%0A%0A1.%20User%20Experience%3A%0A%20%20%20%5BYour%20feedback%20here%5D%0A%0A2.%20Feature%20Requests%3A%0A%20%20%20%5BYour%20suggestions%20for%20additional%20features%5D%0A%0A3.%20Performance%3A%0A%20%20%20%5BAny%20performance%20issues%20or%20bugs%20you%20encountered%5D%0A%0A4.%20Overall%20Satisfaction%3A%0A%20%20%20%5BRate%20your%20overall%20satisfaction%20on%20a%20scale%20of%201%20to%205%5D%0A%0AAdditional%20Comments%3A%0A%5BFeel%20free%20to%20provide%20any%20additional%20comments%20or%20thoughts%20here%5D%0A%0AThank%20you%20for%20providing%20this%20opportunity%20to%20share%20my%20feedback.%20I%20believe%20that%20by%20working%20together%2C%20we%20can%20make%20EngageGPT%20even%20more%20valuable%20for%20users%20like%20myself.%0A%0ALooking%20forward%20to%20seeing%20the%20continued%20improvement%20of%20EngageGPT%21%0A%0ABest%20regards%2C%0A%5BYour%20Name%5D&subject=EngageGPT%20Feedback%20Form" style="height:48px;width:168px;v-text-anchor:middle;" arcsize="69%" strokeweight="0.75pt" strokecolor="#746ff0" fillcolor="#ffffff">
      <w:anchorlock/>
      <v:textbox inset="0px,0px,0px,0px">
      <center style="color:#000000; font-family:Arial, sans-serif; font-size:16px">
      <![endif]--><a href="mailto:engagegpt@gmail.com?body=Dear%20EngageGPT%20Team%2C%0A%0AI%20hope%20this%20message%20finds%20you%20well.%20I%27m%20writing%20to%20share%20my%20feedback%20and%20suggestions%20regarding%20the%20EngageGPT%20extension.%20Your%20commitment%20to%20improving%20user%20experience%20is%20commendable%2C%20and%20I%27m%20eager%20to%20contribute%20to%20the%20enhancement%20of%20the%20platform.%0A%0AFeedback%20Details%3A%0A%0A1.%20User%20Experience%3A%0A%20%20%20%5BYour%20feedback%20here%5D%0A%0A2.%20Feature%20Requests%3A%0A%20%20%20%5BYour%20suggestions%20for%20additional%20features%5D%0A%0A3.%20Performance%3A%0A%20%20%20%5BAny%20performance%20issues%20or%20bugs%20you%20encountered%5D%0A%0A4.%20Overall%20Satisfaction%3A%0A%20%20%20%5BRate%20your%20overall%20satisfaction%20on%20a%20scale%20of%201%20to%205%5D%0A%0AAdditional%20Comments%3A%0A%5BFeel%20free%20to%20provide%20any%20additional%20comments%20or%20thoughts%20here%5D%0A%0AThank%20you%20for%20providing%20this%20opportunity%20to%20share%20my%20feedback.%20I%20believe%20that%20by%20working%20together%2C%20we%20can%20make%20EngageGPT%20even%20more%20valuable%20for%20users%20like%20myself.%0A%0ALooking%20forward%20to%20seeing%20the%20continued%20improvement%20of%20EngageGPT%21%0A%0ABest%20regards%2C%0A%5BYour%20Name%5D&subject=EngageGPT%20Feedback%20Form" target="_blank" style="text-decoration:none;display:inline-block;color:#000000;background-color:#ffffff;border-radius:30px;width:auto;border-top:1px solid #746ff0;font-weight:400;border-right:1px solid #746ff0;border-bottom:1px solid #746ff0;border-left:1px solid #746ff0;padding-top:5px;padding-bottom:5px;font-family:Arial, Helvetica, sans-serif;font-size:16px;text-align:center;mso-border-alt:none;word-break:keep-all;"><span style="padding-left:20px;padding-right:20px;font-size:16px;display:inline-block;letter-spacing:normal;"><span style="word-break: break-word; line-height: 32px;"><strong>Share Feedback</strong></span></span></a><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table class="row row-6" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #011638;">
                  <tbody>
                    <tr>
                      <td>
                        <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-radius: 0; color: #000000; width: 595px; margin: 0 auto;" width="595">
                          <tbody>
                            <tr>
                              <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
                                <table class="paragraph_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                  <tr>
                                    <td class="pad" style="padding-left:20px;padding-right:20px;padding-top:20px;">
                                      <div style="color:#ffffff;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:19px;font-weight:400;letter-spacing:0px;line-height:180%;text-align:center;mso-line-height-alt:34.2px;">
                                        <p style="margin: 0;"><strong>Happy Engaging</strong><br><strong>Team EngageGPT</strong></p>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                                <table class="image_block block-2" width="100%" border="0" cellpadding="25" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                  <tr>
                                    <td class="pad">
                                      <div class="alignment" align="center" style="line-height:10px">
                                        <div style="max-width: 178.5px;"><img src="https://fceae5ec2c.imgdist.com/pub/bfra/jyy05d7s/q7p/8b5/we0/EngageGPTLogo.png" style="display: block; height: auto; border: 0; width: 100%;" width="178.5" height="auto"></div>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table class="row row-7" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;">
                  <tbody>
                    <tr>
                      <td>
                        <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 595px; margin: 0 auto;" width="595">
                          <tbody>
                            <tr>
                              <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">

                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table><!-- End -->
      </body>
      
      </html>`,
  };
  mailgun.messages().send(data, function (err, body) {
    if (err) {
      res.status(500).send({ error: 'Error sending email' });
    } else {
      res.status(200).send({ message: 'Email sent successfully' });
    }
  });
};
