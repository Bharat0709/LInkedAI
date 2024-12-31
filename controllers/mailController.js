const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const otpCache = require('../utils/cache');
const Mailgun = require('mailgun-js');
const { RateLimiterMemory } = require('rate-limiter-flexible');
dotenv.config();
const api_key = process.env.MAILGUN_API_KEY;

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

exports.sendNewUserEmail = async (user) => {
  var mailgun = new Mailgun({ apiKey: api_key, domain: domain });
  var data = {
    from: from_who,
    to: 'pahwabharat15@gmail.com',
    cc: 'letsbunktoday@gmail.com',
    subject: 'New User Added',
    html: ` <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h1 style="color: #4CAF50;">New User Created</h1>
        <p style="font-size: 16px;">A new user has been created with the following details:</p>
        <ul style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; list-style-type: none;">
          <li style="margin-bottom: 10px;">
            <strong>Name:</strong> 
            <span style="color: #555;">${user.name}</span>
          </li>
          <li style="margin-bottom: 10px;">
            <strong>Email:</strong> 
            <span style="color: #555;">${user.email}</span>
          </li>
          <li style="margin-bottom: 10px;">
            <strong>Profile Link:</strong> 
            <a href="${
              user.profileLink
            }" style="color: #1a73e8; text-decoration: none;">${
      user.profileLink
    }</a>
          </li>
          <li style="margin-bottom: 10px;">
            <strong>Account Created At:</strong> 
            <span style="color: #555;">${new Date(
              user.accountCreatedAt
            ).toLocaleString()}</span>
          </li>
        </ul>
      </div>`,
  };
  mailgun.messages().send(data, function (err, body) {
    if (err) {
      console.log(err);
    } else {
      console.log('success');
    }
  });
};

exports.helpRequest = async (user, helpMessage) => {
  var mailgun = new Mailgun({ apiKey: api_key, domain: domain });
  var data = {
    from: from_who,
    to: 'pahwabharat15@gmail.com',
    cc: 'letsbunktoday@gmail.com',
    subject: `help Request from ${user?.name}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Help Request</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            background-color: #f4f4f4;
            color: #333;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: auto;
            background: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #555;
        }
        p {
            margin-bottom: 10px;
        }
        .profile-pic {
            border-radius: 50%;
            width: 80px;
            height: 80px;
            margin-bottom: 10px;
        }
        .credits-info {
            margin-top: 20px;
            padding: 10px;
            background-color: #e8f0fe;
            border-left: 4px solid #007bff;
        }
        .cta {
            text-align: center;
            margin-top: 20px;
        }
        .cta a {
            text-decoration: none;
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            border-radius: 5px;
            font-weight: bold;
        }
    </style>
</head>
<body>

<div class="container">
    <h1>Help Request from ${user?.name}</h1>
    <p>Dear ${user?.name},</p>
    <p>Reaching out for assistance.</p>
    <p>Here are your details:</p>
    <p><strong>Email:</strong> ${user?.email}</p>
    <p><strong>Plan:</strong> ${user?.plan}</p>
    <p><strong>Credits:</strong> ${user?.credits}</p>
    <p><strong>Total Credits Used:</strong> ${user?.totalCreditsUsed}</p>

    <div class="credits-info">
        <p>Help Request <br/> ${helpMessage}</p>
    </div>
</div>

</body>
</html>
`,
  };
  mailgun.messages().send(data, function (err, body) {
    if (err) {
      console.log(err);
    } else {
      console.log('success');
    }
  });
};

exports.feedback = async (user, rating, feedback) => {
  var mailgun = new Mailgun({ apiKey: api_key, domain: domain });
  var data = {
    from: from_who,
    to: 'pahwabharat15@gmail.com',
    cc: 'letsbunktoday@gmail.com',
    subject: `Feedback from ${user?.name}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Help Request</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            background-color: #f4f4f4;
            color: #333;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: auto;
            background: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #555;
        }
        p {
            margin-bottom: 10px;
        }
        .profile-pic {
            border-radius: 50%;
            width: 80px;
            height: 80px;
            margin-bottom: 10px;
        }
        .credits-info {
            margin-top: 20px;
            padding: 10px;
            background-color: #e8f0fe;
            border-left: 4px solid #007bff;
        }
        .cta {
            text-align: center;
            margin-top: 20px;
        }
        .cta a {
            text-decoration: none;
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            border-radius: 5px;
            font-weight: bold;
        }
    </style>
</head>
<body>

<div class="container">
    <h1>${user?.name} Rated ${rating} stars</h1>
    <p>Here are your details:</p>
    <p><strong>Email:</strong> ${user?.email}</p>
    <p><strong>Plan:</strong> ${user?.plan}</p>
    <p><strong>Credits:</strong> ${user?.credits}</p>
    <p><strong>Total Credits Used:</strong> ${user?.totalCreditsUsed}</p>
    <p>${user?.name} rated <strong>${rating}</strong> Stars </p><br/>
    <div class="credits-info">
        <p>Feedback <br/> ${feedback}</p>
    </div>
</div>

</body>
</html>
`,
  };
  mailgun.messages().send(data, function (err, body) {
    if (err) {
      console.log(err);
    } else {
      console.log('success');
    }
  });
};

exports.sendNewMemberInviteEmail = async (
  OrganizationName,
  MemberName,
  MemberEmail,
  ConnectionToken
) => {
  var mailgun = new Mailgun({ apiKey: api_key, domain: domain });
  var data = {
    from: from_who,
    to: MemberEmail,
    subject: 'New Member Invite',
    html: `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connect Your LinkedIn Profile to EngageGPT</title>
  <style>
    body {
      font-family: sans-serif; /* Use a generic sans-serif font for wider compatibility */
      line-height: 1.6;
      color: #333;
      background-color: #fff; /* Set white background for better contrast */
      padding: 20px;
      margin: 0 auto; /* Center the content horizontally */
      max-width: 600px; /* Limit email width for better mobile viewing */
    }

    .container {
      background-color: #f4f4f9; /* Light gray background for the container */
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Subtle shadow effect */
    }

    h1 {
      color: #007bff; /* Maintain blue accent color */
      text-align: center;
      margin-bottom: 20px;
      font-size: 24px; /* Increase heading size */
    }

    p {
      margin: 0 0 15px;
      font-size: 16px;
      color: #555;
    }

    .token {
      font-weight: bold;
      color: #fff; /* Use white text for better contrast on blue background */
      background-color: #007bff;
      padding: 10px 20px; /* Increase padding for better readability */
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
      display: inline-block; /* Display as inline-block for better layout */
    }

    a {
      color: #007bff;
      text-decoration: none;
      font-weight: bold;
    }

    a:hover {
      text-decoration: underline;
    }

    .footer {
      margin-top: 30px;
      font-size: 14px;
      color: #555;
      text-align: center;
    }
  </style>
</head>
<body>

<div class="container">
  <h1>Connect Your LinkedIn Profile to EngageGPT</h1>
  <p>Dear <strong>${MemberName}</strong>,</p>
  <p>An admin from <strong>${OrganizationName}</strong> on EngageGPT would like you to connect your LinkedIn profile to access the EngageGPT dashboard.</p>
  <p>This connection allows you to leverage powerful EngageGPT features directly within the EngageGPT platform.</p>
  <ol style="list-style: disc inside none; padding-left: 20px;">  <li>Download the EngageGPT Chrome extension: <a href="https://chrome.google.com/webstore/detail/engagegpt-extension">Download extension</a></li>
    <li>Copy your EngageGPT token below and paste it into the EngageGPT Chrome extension to connect your LinkedIn profile.</li>
  </ol>
  <p class="token">Your EngageGPT token: <strong>${ConnectionToken}</strong></p>
  <p>By keeping the EngageGPT Chrome extension installed, you ensure seamless connection and data flow.</p>
  <p>Feel free to reply to this email if you have any questions.</p>
  <div class="footer">
    <p>Thank you,</p>
    <p>The EngageGPT Team</p>
  </div>
</div>

</body>
</html>`,
  };
  mailgun.messages().send(data, function (err, body) {
    if (err) {
      console.log(err);
    } else {
      console.log('success');
    }
  });
};

exports.sendResetPasswordURL = async (email, subject, resetURL) => {
  var mailgun = new Mailgun({ apiKey: api_key, domain: domain });
  var data = {
    from: from_who,
    to: email,
    subject: subject,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7f7f7;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f7f7f7; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600px" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color: #007bff; padding: 20px; text-align: center; color: #ffffff; font-size: 24px; font-weight: bold;">
              Password Reset Request
            </td>
          </tr>
          <tr>
            <td style="padding: 20px; color: #333333; font-size: 16px; line-height: 1.5;">
              <p>Hi,</p>
              <p>We received a request to reset your password. If you made this request, please click the button below to reset your password:</p>
              <p style="text-align: center; margin: 20px 0;">
                <a href="${resetURL}" style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-size: 16px;">Reset Password</a>
              </p>
              <p>If you didn’t request a password reset, please ignore this email or contact support if you have concerns.</p>
              <p>This link will expire in <strong>10 minutes</strong>.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f1f1f1; padding: 10px; text-align: center; color: #888888; font-size: 14px;">
              <p>If the button above doesn’t work, copy and paste the following link into your browser:</p>
              <p style="word-wrap: break-word; color: #007bff;">${resetURL}</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #007bff; padding: 10px; text-align: center; color: #ffffff; font-size: 12px;">
              <p>EngaeGPT</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`,
  };
  mailgun.messages().send(data, function (err, body) {
    if (err) {
      console.log(err);
    } else {
      console.log('success');
    }
  });
};
