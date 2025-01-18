const axios = require('axios');
const dotenv = require('dotenv');
const Member = require('../models/members');
const AppError = require('../utils/appError');
const querystring = require('querystring');
const { encryptToken, generateState } = require('../utils/linkedInAuth');
dotenv.config();

exports.linkedinAuth = async (req, res, next) => {
  try {
    const state = generateState();
    req.session.state = state;

    // Ensure session is saved before redirect
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          reject(err);
        }
        resolve();
      });
    });

    console.log('Generated state:', state);
    console.log('Session state:', req.session.state);
    console.log('Session ID:', req.sessionID);

    const params = {
      response_type: 'code',
      client_id: process.env.LINKEDIN_CLIENT_ID,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URL,
      scope: process.env.LINKEDIN_SCOPE,
      state,
    };

    const authUrl = `${process.env.LINKEDIN_BASE_URL}?${querystring.stringify(
      params
    )}`;
    res.redirect(authUrl);
  } catch (err) {
    console.error('Error in linkedinAuth:', err);
    next(new AppError('LinkedIn authentication initialization failed.', 401));
  }
};

exports.linkedinAuthCallback = async (req, res, next) => {
  try {
    // Enhanced debug logging
    console.log('Callback Session Data:', {
      sessionExists: !!req.session,
      sessionID: req.sessionID,
      sessionState: req.session?.state,
      queryState: req.query?.state,
      cookies: req.cookies,
    });

    if (!req.session) {
      throw new AppError('No session found in callback.', 401);
    }

    if (!req.session.state) {
      throw new AppError('No state found in session.', 401);
    }

    const { code, state } = req.query;

    if (!state) {
      throw new AppError('No state parameter received in callback.', 401);
    }

    if (state !== req.session.state) {
      console.error('State mismatch:', {
        receivedState: state,
        sessionState: req.session.state,
      });
      throw new AppError('State parameter mismatch.', 401);
    }

    // Clear state after verification
    delete req.session.state;

    // Exchange code for access token
    const tokenResponse = await axios
      .post(
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
          },
        }
      )
      .catch((error) => {
        console.error(
          'Token exchange error:',
          error.response?.data || error.message
        );
        throw new AppError('Failed to exchange code for access token.', 401);
      });

    const accessToken = tokenResponse.data.access_token;
    const hashedToken = await encryptToken(accessToken);

    // Fetch user profile with error handling
    const profileResponse = await axios
      .get(process.env.LINKEDIN_USER_INFO, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .catch((error) => {
        console.error(
          'Profile fetch error:',
          error.response?.data || error.message
        );
        throw new AppError('Failed to fetch LinkedIn profile.', 401);
      });

    const profile = profileResponse.data;
    const profileId = await encryptToken(profile.sub);
    const email = profile.email;

    if (!email) {
      throw new AppError('Email not provided by LinkedIn.', 401);
    }

    const member = await Member.findOne({ email });

    if (!member) {
      console.log('Member not found for email:', email);
      return res.redirect(
        `${process.env.CLIENT_URL}/dashboard/quick-post?isConnected=false&error=Member not found`
      );
    }

    // Update member data
    Object.assign(member, {
      linkedinAccessToken: hashedToken,
      isLinkedinConnected: true,
      tokenExpiresIn: Date.now() + tokenResponse.data.expires_in * 1000,
      profilePicture: profile?.picture || member.profilePicture,
      name: profile?.name || member.name,
      linkedinProfileId: profileId,
    });

    await member.save();

    // Ensure session changes are saved before redirect
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('Session save error in callback:', err);
          reject(err);
        }
        resolve();
      });
    });

    res.redirect(
      `${process.env.CLIENT_URL}/dashboard/quick-post?isConnected=true`
    );
  } catch (err) {
    console.error('LinkedIn callback error:', err);
    next(new AppError(err.message || 'Authentication callback failed.', 401));
  }
};
