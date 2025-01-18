const dotenv = require('dotenv');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const { signToken, createSendToken } = require('./../middlewares/tokenUtils');
const Organization = require('./../models/organization');
const { encryptToken } = require('../utils/linkedInAuth');
const { sendResetPasswordURL } = require('./mailController');
dotenv.config();

exports.signupOrganization = catchAsync(async (req, res, next) => {
  const { email, password, passwordConfirm } = req.body;

  if (!email || !password || !passwordConfirm) {
    return next(new AppError('Please provide all required fields.', 400));
  }

  if (password !== passwordConfirm) {
    return next(new AppError('Passwords do not match.', 400));
  }

  const existingOrg = await Organization.findOne({ email });
  if (existingOrg) {
    return next(new AppError('Email already exists.', 400));
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const organization = new Organization({
    email,
    password: hashedPassword,
    name: 'EngageGPT User',
    credits: 100,
    oauthProvider: 'password',
    isVerified: true,
    isActive: true,
  });

  const data = await organization.save();

  const orgObj = {
    _id: data._id,
    email: data.email,
  };

  const isOrganization = true;
  const isMember = false;
  await createSendToken(orgObj, 201, res, isOrganization, isMember);
});

exports.loginOrganization = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const organization = await Organization.findOne({ email }).select(
    '+password'
  );

  if (!organization) {
    return next(new AppError('User does not exist', 401));
  }

  const isMatch = await bcrypt.compare(password, organization.password);
  if (!organization || !isMatch) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(organization, 200, res, true, false);
});

exports.verifyOrganizationDetails = catchAsync(async (req, res, next) => {
  const user = req.organization;
  res.status(200).json({
    status: 'success',
    user: {
      profilePicture: user.profilePicture,
      name: user.name,
      email: user.email,
      credits: user.credits,
      subscription: user.subscription,
      oauthProvider: user.oauthProvider,
    },
  });
});

const createGoogleAuthToken = async (user, res, isOrganization = false) => {
  const token = signToken(user._id, isOrganization);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  return token;
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/api/v1/organization/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingOrg = await Organization.findOne({
          email: profile.emails[0].value,
        });

        if (existingOrg) {
          existingOrg.name = profile.displayName;
          existingOrg.oauthProvider = 'google';
          existingOrg.oauthId = encryptToken(profile.id);
          existingOrg.profilePicture = profile.photos[0].value || null;
          await existingOrg.save();
          return done(null, existingOrg);
        }

        const newOrg = await Organization.create({
          email: profile.emails[0].value,
          oauthProvider: 'google',
          name: profile.displayName || 'EngageGPT User',
          profilePicture: profile.photos[0].value || null,
          oauthId: encryptToken(profile.id),
          credits: 100,
          subscription: { plan: 'basic', status: 'active' },
        });
        done(null, newOrg);
      } catch (err) {
        done(err, null);
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

exports.googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

exports.googleAuthCallback = async (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user) => {
    if (err || !user) {
      return next(new AppError('Authentication failed.', 401));
    }

    const token = await createGoogleAuthToken(user, res, true);

    res.redirect(`${process.env.CLIENT_URL}/dashboard?token=${token}`);
  })(req, res, next);
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const organization = await Organization.findOne({ email });
  if (!organization) {
    return next(new AppError('There is no user with that email address.', 404));
  }

  const resetToken = organization.createPasswordResetToken();

  await organization.save({ validateBeforeSave: false });

  const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendResetPasswordURL(
      organization.email,
      'Reset your password (valid for 10 minutes)',
      resetURL
    );

    res.status(200).json({
      status: 'success',
      message: 'Password reset link sent to email!',
    });
  } catch (err) {
    organization.resetPasswordToken = undefined;
    organization.resetPasswordExpires = undefined;
    await organization.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password, passwordConfirm } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const organization = await Organization.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!organization) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  if (password !== passwordConfirm) {
    return next(new AppError('Passwords do not match.', 400));
  }

  organization.password = await bcrypt.hash(password, 12);
  organization.resetPasswordToken = undefined;
  organization.resetPasswordExpires = undefined;

  await organization.save();

  await createSendToken(organization, 200, res, true, false);
});
