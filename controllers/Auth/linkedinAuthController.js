const axios = require('axios');
const dotenv = require('dotenv');
const querystring = require('querystring');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const Member = require('../../models/members');
const AppError = require('../../utils/appError');
const StateStore = require('../../models/stateStore');
const { encryptToken, generateState, generateCSRFToken, validateAuthParams, validateCallbackParams, validateEnvironmentVariables } = require('../../utils/linkedInAuth');
const { findByEmail } = require('../../repositories/memberRepository');

dotenv.config();

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

exports.linkedinAuth = [
  authRateLimit,
  async (req, res, next) => {
    try {
      // Generate secure OAuth state & CSRF token
      const state = generateState();
      const csrfToken = generateCSRFToken();

      // Get user info if authenticated
      const userId = req.organization?._id;

      // Store in DATABASE instead of session
      await StateStore.create({
        state,
        csrfToken,
        userId,
      });

      // Build LinkedIn authorization URL
      const params = {
        response_type: 'code',
        client_id: process.env.LINKEDIN_CLIENT_ID,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URL,
        scope: process.env.LINKEDIN_SCOPE || 'openid profile email w_member_social',
        state: `${state}.${csrfToken}`, // Combined state
      };

      const authUrl = `${process.env.LINKEDIN_BASE_URL || 'https://www.linkedin.com/oauth/v2/authorization'}?${querystring.stringify(params)}`;

      // Direct redirect (no session needed)
      return res.redirect(authUrl);
    } catch (err) {
      console.error('[LinkedInAuth ERROR]', err);
      next(new AppError('Authentication initialization failed', 500));
    }
  },
];

exports.linkedinAuthCallback = [
  authRateLimit,
  async (req, res, next) => {
    try {
      const { code, state: receivedState, error } = req.query;
      // Handle LinkedIn errors
      if (error) {
        console.error('[LinkedInAuth CALLBACK] LinkedIn error:', error);
        return res.redirect(`${process.env.CLIENT_URL}/dashboard/quick-post?isConnected=false&error=${encodeURIComponent('Authentication cancelled or failed')}`);
      }

      // Validate callback params
      if (!code || !receivedState) {
        throw new AppError('Missing authorization code or state', 400);
      }

      // Parse received state
      const [state, csrfToken] = receivedState.split('.');
      if (!state || !csrfToken) {
        throw new AppError('Invalid state format', 401);
      }

      // Retrieve and verify state from DATABASE
      const storedState = await StateStore.findOne({
        state,
        csrfToken,
      });

      if (!storedState) {
        throw new AppError('Session expired or invalid', 401);
      }

      // Delete used state immediately (one-time use)
      await StateStore.deleteOne({ _id: storedState._id });
      const tokenResponse = await axios.post(
        process.env.LINKEDIN_ACCESS_TOKEN_URL || 'https://www.linkedin.com/oauth/v2/accessToken',
        querystring.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: process.env.LINKEDIN_REDIRECT_URL,
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            'User-Agent': `${process.env.APP_NAME || 'LinkedInApp'}/1.0`,
          },
          timeout: 30000,
        }
      );

      if (!tokenResponse.data?.access_token) {
        throw new AppError('Invalid token response from LinkedIn', 502);
      }
      const { access_token: accessToken, expires_in: expiresIn } = tokenResponse.data;

      const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenResponse.data.access_token}`,
          Accept: 'application/json',
          'User-Agent': `${process.env.APP_NAME || 'LinkedInApp'}/1.0`,
        },
      });

      const profile = profileResponse.data;
      const encryptedToken = encryptToken(accessToken);

      if (!profile.sub || !profile.email) {
        throw new AppError('Incomplete profile data from LinkedIn', 502);
      }

      if (!validator.isEmail(profile.email)) {
        throw new AppError('Invalid email format from LinkedIn', 502);
      }

      /* ----------------------------- Find or Update Member ----------------------------- */
      const email = profile.email;
      const profileId = encryptToken(profile.sub);

      let member = await findByEmail(email);

      if (!member) {
        console.warn(`[LinkedInAuth] Member not found: ${email}`);
        return res.redirect(`${process.env.CLIENT_URL}/dashboard/quick-post?isConnected=false&error=${encodeURIComponent('Member account not found. Please register first.')}`);
      }

      const updateData = {
        linkedinAccessToken: encryptedToken,
        isLinkedinConnected: true,
        linkedinProfileId: profileId,
        tokenExpiresIn: Date.now() + expiresIn * 1000,
      };

      if (!member.profilePicture && profile.picture) {
        updateData.profilePicture = validator.isURL(profile.picture, { protocols: ['https'] }) ? profile.picture : null;
      }

      if (!member.name && profile.name) {
        updateData.name = validator.escape(profile.name.substring(0, 100));
      }

      await Member.findByIdAndUpdate(member._id, { $set: updateData }, { new: true });

      // Cleanup
      tokenResponse.data = null;
      profileResponse.data = null;

      return res.redirect(`${process.env.CLIENT_URL}/dashboard/quick-post?isConnected=true&timestamp=${Date.now()}`);
    } catch (err) {
      console.error('[LinkedInAuth CALLBACK ERROR]', err);
      let errorMessage = 'Authentication failed';
      let statusCode = 401;

      if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
        errorMessage = 'LinkedIn service timeout';
        statusCode = 504;
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid request to LinkedIn';
        statusCode = 400;
      } else if (err.response?.status >= 500) {
        errorMessage = 'LinkedIn service unavailable';
        statusCode = 502;
      }

      if (err.isOperational) {
        return res.redirect(`${process.env.CLIENT_URL}/dashboard/quick-post?isConnected=false&error=${encodeURIComponent(err.message)}`);
      }

      next(new AppError(errorMessage, statusCode));
    }
  },
];

/* ------------------------------- Health Endpoint ------------------------------ */
exports.linkedinAuthHealth = (req, res) => {
  try {
    validateEnvironmentVariables();
    res.status(200).json({
      status: 'healthy',
      service: 'linkedin-auth',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      service: 'linkedin-auth',
      error: 'Configuration error',
      timestamp: new Date().toISOString(),
    });
  }
};

module.exports = exports;
