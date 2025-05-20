const { RateLimiterMemory } = require('rate-limiter-flexible');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Create different rate limits by endpoint type
const apiRateLimiter = new RateLimiterMemory({
  points: 4,
  duration: 60,
});

const postSaveRateLimiter = new RateLimiterMemory({
  points: 50,
  duration: 60,
  keyPrefix: 'post-save',
});

// Use the appropriate rate limiter based on the route
const rateLimitMiddleware = catchAsync(async (req, res, next) => {
  const userId = req.member.id;

  // Use different rate limiter based on endpoint
  const limiter = req.path.includes('/hiring-posts')
    ? postSaveRateLimiter
    : apiRateLimiter;

  try {
    // Include response headers with rate limit info
    const rateLimitRes = await limiter.consume(userId);

    // Add rate limit headers so client can adapt
    res.setHeader(
      'X-RateLimit-Limit',
      req.path.includes('/hiring-posts') ? 10 : 4
    );
    res.setHeader('X-RateLimit-Remaining', rateLimitRes.remainingPoints);
    res.setHeader(
      'X-RateLimit-Reset',
      new Date(Date.now() + rateLimitRes.msBeforeNext).toISOString()
    );

    next();
  } catch (rateLimitRes) {
    // Also send limit info when rejecting
    res.setHeader(
      'X-RateLimit-Limit',
      req.path.includes('/hiring-posts') ? 10 : 4
    );
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader(
      'X-RateLimit-Reset',
      new Date(Date.now() + rateLimitRes.msBeforeNext).toISOString()
    );

    throw new AppError(
      'Too many requests, please try again in ' +
        Math.ceil(rateLimitRes.msBeforeNext / 1000) +
        ' seconds.',
      429
    );
  }
});

module.exports = rateLimitMiddleware;
