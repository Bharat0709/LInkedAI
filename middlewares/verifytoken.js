const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Member = require('../models/members');
const Organization = require('../models/organization');
const { decodeToken } = require('../utils/tokenUtils');

exports.verifyToken = catchAsync(async (req, res, next) => {
  let token;

  // 1️⃣ Get token from Authorization header or cookie
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.['engage-gpt']) {
    token = decodeToken(req.cookies['engage-gpt']);
  }

  // 2️⃣ If no token found → unauthorized
  if (!token) {
    return next(new AppError('You are not authorized to perform this action', 401));
  }

  // 3️⃣ Verify and decode token
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  } catch (err) {
    // Handle specific JWT errors
    if (err.name === 'TokenExpiredError') {
      console.warn('⚠️ JWT Token Expired:', err.expiredAt);

      // Clear cookie (if exists)
      res.clearCookie('engage-gpt');

      // If this is an API → respond with JSON
      if (req.originalUrl.startsWith('/api')) {
        return next(new AppError('Session expired. Please log in again.', 401));
      }

      // If frontend route → redirect to login
      return res.redirect('/login');
    }

    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }

    // Other unknown errors
    return next(new AppError('Authentication failed. Try again later.', 401));
  }

  // 4️⃣ Check if user still exists
  const user = decoded.isMember
    ? await Member.findById(decoded.id)
    : await Organization.findById(decoded.id);

  if (!user) {
    const entity = decoded.isMember ? 'Member' : 'Organization';
    return next(new AppError(`${entity} belonging to this token no longer exists.`, 401));
  }

  // 5️⃣ Attach user to request for downstream access
  if (decoded.isMember) req.member = user;
  else req.organization = user;
  next();
});