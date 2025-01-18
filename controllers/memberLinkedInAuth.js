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

    const baseURL = `${process.env.LINKEDIN_BASE_URL}`;
    const params = {
      response_type: 'code',
      client_id: `${process.env.LINKEDIN_CLIENT_ID}`,
      redirect_uri: `${process.env.LINKEDIN_REDIRECT_URL}`,
      scope: `${process.env.LINKEDIN_SCOPE}`,
      state,
    };

    const authUrl = `${baseURL}?${querystring.stringify(params)}`;

    res.redirect(authUrl);
  } catch (err) {
    console.error('Error in linkedinAuth:', err);
    next(new AppError('Authentication failed.', 401));
  }
};

exports.linkedinAuthCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;

    if (state !== req.session.state) {
      throw new AppError('Invalid state parameter.', 401);
    }
    delete req.session.state;

    const tokenResponse = await axios.post(
      process.env.LINKEDIN_ACCESS_TOKEN_URL,
      querystring.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.LINKEDIN_REDIRECT_URL}`,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Hash the access token
    const hashedToken = await encryptToken(accessToken);

    // Fetch user profile
    const profileResponse = await axios.get(process.env.LINKEDIN_USER_INFO, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const profile = profileResponse.data;
    const profileId = await encryptToken(profileResponse.data.sub);
    const email = profileResponse.data.email;
    let member = await Member.findOne({ email });

    if (member) {
      member.linkedinAccessToken = hashedToken;
      member.isLinkedinConnected = true;
      member.tokenExpiresIn = Date.now() + tokenResponse.data.expires_in * 1000;
      member.profilePicture = profile?.picture || member.profilePicture;
      member.name = profile?.name || member.name;
      member.linkedinProfileId = profileId;
      await member.save();
    } else {
      res.redirect(
        `${process.env.CLIENT_URL}/dashboard/quick-post?isConnected=false&error=Member not found`
      );
    }

    res.redirect(
      `${process.env.CLIENT_URL}/dashboard/quick-post?isConnected=true`
    );
  } catch (err) {
    console.error(
      'Error in linkedinAuthCallback:',
      err.response?.data || err.message
    );
    next(new AppError('Authentication failed.', 401));
  }
};
