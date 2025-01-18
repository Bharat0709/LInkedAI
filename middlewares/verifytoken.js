const admin = require('../config/firebase-config');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

class Middleware {
  decodeToken = catchAsync(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(
        new AppError('Authorization header is missing or invalid.', 401)
      );
    }

    const token = authHeader.split(' ')[1];
    const decodeValue = await admin.auth().verifyIdToken(token);

    if (!decodeValue) {
      return next(new AppError('Unauthorized access.', 401));
    }

    next();
  });
}

module.exports = new Middleware();
