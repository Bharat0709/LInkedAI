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

    // Store state in session
    req.session.linkedInState = state;
    req.session.originalUrl = req.get('Referer') || '/';

    // Ensure session is saved before redirect
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        resolve();
      });
    });

    const params = {
      response_type: 'code',
      client_id: process.env.LINKEDIN_CLIENT_ID,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URL,
      scope: process.env.LINKEDIN_SCOPE,
      state: state,
    };

    const authUrl = `${process.env.LINKEDIN_BASE_URL}?${querystring.stringify(
      params
    )}`;
    res.redirect(authUrl);
  } catch (err) {
    next(new AppError('Authentication failed.', 401));
  }
};

exports.linkedinAuthCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    // Add more detailed logging
    console.log('Callback Session Data:', {
      sessionID: req.sessionID,
      linkedInState: req.session?.linkedInState,
      receivedState: state,
      sessionExists: !!req.session,
    });

    if (!req.session || !req.session.linkedInState) {
      throw new AppError('Session expired or invalid.', 401);
    }
    if (state !== req.session.linkedInState) {
      console.error('State mismatch:', {
        receivedState: state,
        sessionState: req.session.linkedInState,
      });
      throw new AppError('Invalid state parameter.', 401);
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
