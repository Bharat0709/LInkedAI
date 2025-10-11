const authService = require('../../services/Auth/authService');
const { createSendToken, signToken } = require('../../middlewares/tokenUtils');
const catchAsync = require('../../utils/catchAsync');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const AppError = require('../../utils/appError');
const Member = require('../../models/members');
const Organization = require('../../models/organization');
const passport = require('passport');
const { encodeToken } = require('../../utils/tokenUtils');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/api/v1/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const organization = await authService.handleGoogleAuth(profile);
        return done(null, organization);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await Organization.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

exports.isUserLoggedIn = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(new AppError('You are not logged in. Login to get access.', 401));
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const user = decoded.isMember ? await Member.findById(decoded.id) : await Organization.findById(decoded.id);

  if (!user) {
    const entity = decoded.isMember ? 'Member' : 'Organization';
    return next(new AppError(`${entity} belonging to this token no longer exists.`, 401));
  }

  if (decoded.isMember) req.member = user;
  else req.organization = user;

  next();
});

exports.initiateSignup = catchAsync(async (req, res, next) => {
  const { email, timeZone } = req.body;
  const result = await authService.initiateSignup(email, timeZone);

  res.status(200).json({
    status: 'success',
    data: result,
    message: result.message,
  });
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { token, email } = req.body;

  const result = await authService.verifyEmail(token, email);

  res.status(200).json({
    success: true,
    status: 'success',
    message: result.message,
    organizationId: result.organizationId,
  });
});

exports.completeSignup = catchAsync(async (req, res, next) => {
  const { email, password, passwordConfirm } = req.body;

  const orgObj = await authService.completeSignup(email, password, passwordConfirm);

  const isOrganization = true;
  const isMember = false;
  await createSendToken(orgObj, 201, res, isOrganization, isMember);
});

exports.resendVerificationEmail = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const result = await authService.resendVerificationEmail(email);

  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});

exports.loginOrganization = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const orgWithTrialInfo = await authService.loginOrganization(email, password);

  createSendToken(orgWithTrialInfo, 200, res, true, false);
});

exports.googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
});

exports.googleAuthCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, organization) => {
    if (err || !organization) {
      console.error('Google authentication error:', err);
      return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
    }

    try {
      console.log('Google authentication successful:');
      const token = signToken(organization.id, true);
      const encodedToken = encodeToken(token);
      console.log(encodedToken);

      // Environment-specific cookie options
      const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        secure: process.env.NODE_ENV === 'production', // only true in prod for HTTPS
      };
      console.log(cookieOptions)
      // Set cookie
      res.cookie('engage-gpt', encodedToken, cookieOptions);
      // Redirect to frontend callback page with token in query
      res.redirect(`${process.env.CLIENT_URL}/auth/google/callback?token=${token}`);
    } catch (error) {
      console.error(error);
      return res.redirect(`${process.env.CLIENT_URL}/login?error=token_failed`);
    }
  })(req, res, next);
};

exports.initiatePasswordReset = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  console.log('Password reset requested for email:', email);
  const result = await authService.initiatePasswordReset(email);
  console.log('Password reset initiation result:', result);
  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token, password, passwordConfirm } = req.body;

  const updatedOrganization = await authService.resetPassword(token, password, passwordConfirm);

  res.status(200).json({
    status: 'success',
    message: 'Password has been reset successfully',
    data: {
      organization: updatedOrganization,
    },
  });
});

exports.logout = catchAsync(async (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

module.exports = exports;
