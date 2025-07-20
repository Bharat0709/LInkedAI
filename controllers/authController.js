const authService = require('../services/Auth/authService');
const { createSendToken } = require('./../middlewares/tokenUtils');
const catchAsync = require('./../utils/catchAsync');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const Member = require('../models/members');
const Organization = require('../models/organization');

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
    trialInfo: result.trialInfo,
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
    trialInfo: result.trialInfo,
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

// Google OAuth authentication
exports.googleAuth = catchAsync(async (req, res, next) => {
  const { profile } = req.body;

  const organization = await authService.handleGoogleAuth(profile);

  createSendToken(organization, 200, res, true, false);
});

// Initiate password reset
exports.initiatePasswordReset = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const result = await authService.initiatePasswordReset(email);

  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});

// Reset password with token
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

// Logout user
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
