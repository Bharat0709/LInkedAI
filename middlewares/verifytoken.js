const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const Member = require('../models/members');
const Organization = require('../models/organization');
const { decodeToken } = require('../utils/tokenUtils');

exports.verifyToken = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('TOKEN FOUND IN HEADERS');
  } else if (req.cookies?.['engage-gpt']) {
    console.log('TOKEN FOUND IN COOKUIES');
    token = decodeToken(req.cookies['engage-gpt']);
    console.log(token);
  }
  console.log('----------------TOKEN ----------', token);
  if (!token) {
    return next(new AppError('You are not authorized to perform this action', 401));
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const user = decoded.isMember ? await Member.findById(decoded.id) : await Organization.findById(decoded.id);
  console.log(decoded);
  if (!user) {
    const entity = decoded.isMember ? 'Member' : 'Organization';
    return next(new AppError(`${entity} belonging to this token no longer exists.`, 401));
  }

  if (decoded.isMember) req.member = user;
  else req.organization = user;

  next();
});
