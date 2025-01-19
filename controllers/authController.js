const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const otpCache = require('../utils/cache');
const Member = require('../models/members');
const Organization = require('../models/organization');

exports.isUserLoggedIn = catchAsync(async (req, res, next) => {
  let token;
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

  const user = decoded.isMember
    ? await Member.findById(decoded.id)
    : await Organization.findById(decoded.id);

  if (!user) {
    const entity = decoded.isMember ? 'Member' : 'Organization';
    return next(
      new AppError(`${entity} belonging to this token no longer exists.`, 401)
    );
  }

  if (decoded.isMember) req.member = user;
  else req.organization = user;

  next();
});

const compareOTP = async (email, otp) => {
  const otpData = otpCache.get(email);
  return otpData && otpData.otp === otp && otpData.expiresAt > Date.now();
};

exports.verifyOTP = catchAsync(async (req, res, next) => {
  const { otp, email } = req.body;

  if (!(await compareOTP(email, otp))) {
    return next(new AppError('Invalid OTP.', 400));
  }

  next();
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