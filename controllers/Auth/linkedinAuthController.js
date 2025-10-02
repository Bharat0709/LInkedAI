const axios = require('axios');
const dotenv = require('dotenv');
const Member = require('../../models/members');
const AppError = require('../../utils/appError');
const querystring = require('querystring');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const { encryptToken, generateState, validateAuthParams, validateEnvironmentVariables, validateCallbackParams, generateCSRFToken } = require('../../utils/linkedInAuth');
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

const configureSession = (req, res, next) => {
  if (!req.session) {
    return next(new AppError('Session not configured properly', 500));
  }
  req.session.cookie.secure = process.env.NODE_ENV === 'production';
  req.session.cookie.httpOnly = true;
  req.session.cookie.sameSite = 'lax';
  req.session.cookie.maxAge = 10 * 60 * 1000;
  next();
};

exports.linkedinAuth = [
  authRateLimit,
  configureSession,
  async (req, res, next) => {
    try {
      // Generate cryptographically secure state parameter
      const state = generateState();
      const csrfToken = generateCSRFToken();

      // Store state and CSRF token in session with expiration
      req.session.linkedinState = {
        state,
        csrfToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      };

      // Prepare LinkedIn OAuth parameters
      const params = {
        response_type: 'code',
        client_id: process.env.LINKEDIN_CLIENT_ID,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URL,
        scope: process.env.LINKEDIN_SCOPE,
        state: `${state}.${csrfToken}`, // Combine state and CSRF token
      };
      // Validate parameters before creating URL
      const validationErrors = validateAuthParams(params);
      if (validationErrors.length > 0) {
        throw new AppError(`Invalid parameters: ${validationErrors.join(', ')}`, 400);
      }

      const authUrl = `${process.env.LINKEDIN_BASE_URL}?${querystring.stringify(params)}`;

      res.redirect(authUrl);
    } catch (err) {
      console.error('Error in linkedinAuth:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        sessionId: req.sessionID?.substring(0, 8),
      });
      next(new AppError('Authentication initialization failed', 500));
    }
  },
];

exports.linkedinAuthCallback = [
  authRateLimit,
  configureSession,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { code, state: receivedState, error } = req.query;
      // Handle LinkedIn error responses
      if (error) {
        console.error('LinkedIn OAuth error:', { error, sessionId: req.sessionID?.substring(0, 8) });
        return res.redirect(`${process.env.CLIENT_URL}/dashboard/quick-post?isConnected=false&error=${encodeURIComponent('Authentication was cancelled or failed')}`);
      }

      // Validate callback parameters
      const validationErrors = validateCallbackParams({ code, state: receivedState });
      if (validationErrors.length > 0) {
        throw new AppError(`Invalid callback parameters: ${validationErrors.join(', ')}`, 400);
      }

      // Retrieve and validate session state
      const sessionState = req.session.linkedinState;
      if (!sessionState || Date.now() > sessionState.expiresAt) {
        delete req.session.linkedinState;
        throw new AppError('Session expired or invalid', 401);
      }

      // Parse received state
      const [state, csrfToken] = receivedState.split('.');
      if (!state || !csrfToken) {
        throw new AppError('Invalid state format', 401);
      }

      // Verify state and CSRF token
      if (state !== sessionState.state || csrfToken !== sessionState.csrfToken) {
        delete req.session.linkedinState;
        throw new AppError('State verification failed - possible CSRF attack', 401);
      }

      // Clean up session state
      delete req.session.linkedinState;

      // Exchange authorization code for access token with timeout
      const tokenResponse = await axios.post(
        process.env.LINKEDIN_ACCESS_TOKEN_URL,
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
          maxRedirects: 0,
        }
      );

      // Validate token response
      if (!tokenResponse.data?.access_token) {
        throw new AppError('Invalid token response from LinkedIn', 502);
      }

      const { access_token: accessToken, expires_in: expiresIn } = tokenResponse.data;

      // Encrypt the access token
      const encryptedToken = encryptToken(accessToken);

      // Fetch user profile with timeout and error handling
      const profileResponse = await axios.get(process.env.LINKEDIN_USER_INFO, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'User-Agent': `${process.env.APP_NAME || 'LinkedInApp'}/1.0`,
        },
        timeout: 30000,
        maxRedirects: 0,
      });
      const profile = profileResponse.data;

      // Validate required profile data
      if (!profile.sub || !profile.email) {
        throw new AppError('Incomplete profile data from LinkedIn', 502);
      }

      // Validate email format
      if (!validator.isEmail(profile.email)) {
        throw new AppError('Invalid email format from LinkedIn', 502);
      }

      const profileId = encryptToken(profile.sub);
      const email = profile.email;
      // Find existing member
      let member = await findByEmail(email);
      if (!member) {
        console.warn(`Authentication attempt for non-existent member: ${email.substring(0, 3)}***`);
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

      await Member.findByIdAndUpdate(member._id, { $set: updateData }, { new: true, runValidators: true });

      tokenResponse.data = null;
      profileResponse.data = null;

      res.redirect(`${process.env.CLIENT_URL}/dashboard/quick-post?isConnected=true&timestamp=${Date.now()}`);
    } catch (err) {
      console.error('Error in linkedinAuthCallback:', {
        message: err.message,
        status: err.status || err.response?.status,
        responseData: err.response?.data ? 'Present (hidden)' : 'None',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        sessionId: req.sessionID?.substring(0, 8),
        duration: Date.now() - startTime,
      });

      if (req.session.linkedinState) {
        delete req.session.linkedinState;
      }

      // Determine appropriate error response
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
