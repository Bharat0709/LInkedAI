const dotenv = require('dotenv');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const bcrypt = require('bcryptjs');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const { signToken, createSendToken } = require('./../middlewares/tokenUtils');
const Organization = require('./../models/organization');
const GuestUser = require('../models/members');
const User = require('./../models/userModel');
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
  });

  const data = await organization.save();

  const orgObj = {
    _id: data._id,
    organizationName: data.organizationName,
    email: data.email,
  };

  createSendToken(orgObj, 201, res, true, false);
});

exports.loginOrganization = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  console.log(email, password);

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const organization = await Organization.findOne({ email }).select(
    '+password'
  );
  console.log(organization);
  const isMatch = await bcrypt.compare(password, organization.password);
  console.log(isMatch);
  if (!organization || !isMatch) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(organization, 200, res, true, false);
});

exports.verifyOrganizationDetails = catchAsync(async (req, res, next) => {
  const user = req.organization;
  console.log(user);
  res.status(200).json({
    status: 'success',
    user: user,
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
          // Update Google OAuth details if necessary
          existingOrg.name = profile.displayName;
          existingOrg.oauthProvider = 'google';
          existingOrg.oauthId = profile.id;
          existingOrg.profilePicture = profile.photos[0].value || null;
          await existingOrg.save();
          return done(null, existingOrg);
        }

        const newOrg = await Organization.create({
          email: profile.emails[0].value,
          oauthProvider: 'google',
          name: profile.displayName || 'Google User',
          profilePicture: profile.photos[0].value || null,
          oauthId: profile.id,
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

// Google Auth Routes
exports.googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

exports.googleAuthCallback = async (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user) => {
    if (err || !user) {
      return next(new AppError('Authentication failed.', 401));
    }

    // Generate token
    const token = await createGoogleAuthToken(user, res, true);

    // Redirect to frontend with token
    res.redirect(`http://localhost:3000/dashboard?token=${token}`);
  })(req, res, next);
};
