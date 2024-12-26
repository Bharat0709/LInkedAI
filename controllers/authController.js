const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const otpCache = require('../utils/cache');
const Member = require('../models/members');
const Organization = require('../models/organization');
const Waitlist = require('../models/waitlist');
const { createSendToken } = require('./../middlewares/tokenUtils');

exports.isUserLoggedIn = catchAsync(async (req, res, next) => {
  console.log('checking if user is logged in');
  let token;
  console.log(token);
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Login to get access.', 401)
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log('Decoded Token:', decoded);

  let user;

  if (decoded.isMember) {
    user = await Member.findById(decoded.id);
    if (!user) {
      return next(
        new AppError('Member belonging to this token no longer exists.', 401)
      );
    }
    req.member = user;
    console.log('member found');
    next();
    return;
  } else {
    user = await Organization.findById(decoded.id);
    if (!user) {
      return next(
        new AppError(
          'Organization belonging to this token no longer exists.',
          401
        )
      );
    }
    req.organization = user;
    console.log('organization found');
    next();
    return;
  }

  console.log('User found:', user);
  next();
});

const compareOTP = async (email, otp) => {
  const otpData = otpCache.get(email);

  if (!otpData) {
    return false;
  }

  return otpData.otp === otp && otpData.expiresAt > Date.now();
};

exports.verifyOTP = async (req, res, next) => {
  const { otp, email } = req.body;
  try {
    const isValidOTP = await compareOTP(email, otp);
    if (!isValidOTP) {
      return res.status(400).json({ success: false, invalidOTP: true });
    }
    next();
  } catch (error) {
    return res.status(500).json({ success: false, servererror: true });
  }
};

exports.addtoWaitlist = catchAsync(async (req, res, next) => {
  try {
    const { email } = req.body;

    // Check if the email is already in the waitlist
    const existingUser = await Waitlist.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: 'Email is already in the waitlist' });
    }

    // Create a new waitlisted user
    const newUser = new Waitlist({ email });
    await newUser.save();

    return res.status(201).json(newUser);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

// exports.addtoguestuser = catchAsync(async (req, res, next) => {
//   const { otp, name, profileLink, email } = req.body;
//   const isValidOTP = await compareOTP(email, otp);
//   if (!isValidOTP) {
//     return res.status(400).json({ success: false, invalidOTP: true });
//   }

//   const existingUser = await GuestUser.findOne({ profileLink });
//   const existingEmail = await GuestUser.findOne({ email });

//   if (existingEmail) {
//     res.status(400).json({ success: false, alreadyExists: true });
//     return next(new AppError('Email Already Exists', 400));
//   }
//   if (existingUser && existingUser.email) {
//     const userObj = {
//       _id: existingUser._id,
//       name: existingUser.name,
//       profileLink: existingUser.profileLink,
//       credits: existingUser.credits,
//       plan: existingUser.plan,
//       email: existingUser.email,
//       daysActive: existingUser.daysActive,
//       tagPost: existingUser.tagPost,
//       leaderBoardProfileVisibility: existingUser.leaderBoardProfileVisibility,
//       accountCreatedAt: existingUser.accountCreatedAt,
//       totalCreditsUsed: existingUser.totalCreditsUsed,
//       lastActive: existingUser.lastActive,
//       currentStreak: existingUser.currentStreak,
//     };
//     createSendToken(userObj, 200, res);
//   }
//   if (!existingUser) {
//     const user = new GuestUser({
//       name: req.body.name,
//       profileLink: req.body.profileLink,
//       email: req.body.email,
//     });

//     const data = await user.save();
//     await sendNewUserEmail(data);
//     const userObj = {
//       _id: data._id,
//       name: data.name,
//       profileLink: data.profileLink,
//       email: data.email,
//       credits: data.credits,
//       plan: data.plan,
//       daysActive: data.daysActive,
//       tagPost: data.tagPost,
//       leaderBoardProfileVisibility: data.leaderBoardProfileVisibility,
//       accountCreatedAt: data.accountCreatedAt,
//       totalCreditsUsed: data.totalCreditsUsed,
//       lastActive: data.lastActive,
//       currentStreak: data.currentStreak,
//     };
//     createSendToken(userObj, 200, res);
//   }
// });
