const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');

const signToken = (id, isOrganization, isMember) => {
  return jwt.sign(
    {
      id,
      isOrganization,
      isMember,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const createSendToken = async (
  user,
  statusCode,
  res,
  isOrganization,
  isMember
) => {
  if (!user) {
    throw new AppError('User data is missing.', 400);
  }

  const token = signToken(user._id, isOrganization, isMember);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    user,
  });
};

module.exports = { signToken, createSendToken };
