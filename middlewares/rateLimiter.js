const { RateLimiterMemory } = require('rate-limiter-flexible');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const rateLimitOpts = {
  points: 4,
  duration: 60,
};

const rateLimiter = new RateLimiterMemory(rateLimitOpts);

const rateLimitMiddleware = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  try {
    await rateLimiter.consume(userId);
    next();
  } catch (err) {
    throw new AppError('Too many requests, please try again later.', 429);
  }
});

module.exports = rateLimitMiddleware;
