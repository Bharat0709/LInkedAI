const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { signToken } = require('../utils/jwt');
const { encryptToken } = require('../utils/linkedInAuth');
const organizationRepository = require('../repositories/organizationRepository');
const AppError = require('../utils/appError');
const { createGoogleOrganizationData } = require('../services/Auth/authHelper');

// Configure Google OAuth Strategy
const configureGoogleStrategy = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BASE_URL}/api/v1/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const existingOrg = await organizationRepository.findByEmail(profile.emails[0].value);

          if (existingOrg) {
            const updateData = {
              name: profile.displayName,
              oauthProvider: 'google',
              oauthId: encryptToken(profile.id),
              profilePicture: profile.photos[0]?.value || null,
              isVerified: true,
              isActive: true,
            };

            const updatedOrg = await organizationRepository.updateById(existingOrg._id, updateData);
            return done(null, updatedOrg);
          }

          // Create new organization
          const newOrgData = createGoogleOrganizationData(profile);
          const newOrg = await organizationRepository.create(newOrgData);
          return done(null, newOrg);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
};

// Serialize and deserialize user
const configurePassportSerialization = () => {
  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await organizationRepository.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};

// Create Google Auth Token
const createGoogleAuthToken = async (user, res, isOrganization = false) => {
  const token = signToken(user._id, isOrganization);

  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  return token;
};

// Middleware for Google OAuth initiation
const googleAuthMiddleware = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

// Middleware for Google OAuth callback
const googleAuthCallbackMiddleware = async (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user) => {
    if (err || !user) {
      return next(new AppError('Authentication failed.', 401));
    }

    try {
      // Add login to activity log
      const logEntry = {
        action: 'user_login',
        timestamp: new Date(),
        metadata: {
          method: 'google_oauth',
          trialStatus: user.subscription.status,
        },
      };

      await organizationRepository.addToActivityLog(user._id, logEntry);

      const token = await createGoogleAuthToken(user, res, true);
      res.redirect(`${process.env.CLIENT_URL}/dashboard?token=${token}`);
    } catch (error) {
      return next(new AppError('Authentication processing failed.', 500));
    }
  })(req, res, next);
};

// Initialize Google Auth Plugin
const initializeGoogleAuth = () => {
  configureGoogleStrategy();
  configurePassportSerialization();
};

module.exports = {
  initializeGoogleAuth,
  googleAuthMiddleware,
  googleAuthCallbackMiddleware,
  createGoogleAuthToken,
};
