const dotenv = require('dotenv');
dotenv.config();
const Mailgun = require('mailgun-js');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const otpCache = require('../utils/cache');
const domain = 'support.engagegpt.in';
var from_who = 'engagegpt@gmail.com';
const api_key = process.env.MAILGUN_API_KEY;

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
      html: ``,
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
