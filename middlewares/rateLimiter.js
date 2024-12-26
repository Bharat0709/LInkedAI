const { RateLimiterMemory } = require('rate-limiter-flexible');

const rateLimitOpts = {
  points: 4,
  duration: 60,
};

const rateLimiter = new RateLimiterMemory(rateLimitOpts);

const rateLimitMiddleware = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await rateLimiter.consume(userId);

    next();
  } catch (err) {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
    });
  }
};

module.exports = rateLimitMiddleware;
