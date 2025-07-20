const organizationService = require('../services/organizationService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Middleware to check trial status on every request
const checkTrialStatus = catchAsync(async (req, res, next) => {
  if (req.organization) {
    const trialStatus = await organizationService.checkAndUpdateTrialStatus(
      req.organization._id
    );

    // Add trial status to request object for use in controllers
    req.trialStatus = trialStatus;

    // If trial has expired and user is trying to access premium features, block access
    if (trialStatus.trialExpired && req.requiresActivePlan) {
      return next(
        new AppError(
          'Trial period has expired. Please upgrade your subscription to continue.',
          403
        )
      );
    }
  }

  next();
});

// Middleware to check usage limits before certain actions
const checkUsageLimits = (usageType) => {
  return catchAsync(async (req, res, next) => {
    if (req.organization) {
      try {
        await organizationService.checkUsageLimits(
          req.organization._id,
          usageType
        );
        next();
      } catch (error) {
        return next(error);
      }
    } else {
      next();
    }
  });
};

// Middleware to mark routes that require active subscription
const requiresActivePlan = (req, res, next) => {
  req.requiresActivePlan = true;
  next();
};

// Middleware to automatically increment usage after successful action
const incrementUsageAfter = (usageType, amount = 1) => {
  return catchAsync(async (req, res, next) => {
    // Store original json method
    const originalJson = res.json;

    // Override json method to increment usage after successful response
    res.json = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.organization) {
        // Increment usage asynchronously after sending response
        organizationService
          .incrementUsage(req.organization._id, usageType, amount)
          .catch((error) => {
            console.error('Failed to increment usage:', error);
          });
      }

      // Call original json method
      originalJson.call(this, data);
    };

    next();
  });
};

module.exports = {
  checkTrialStatus,
  checkUsageLimits,
  requiresActivePlan,
  incrementUsageAfter,
};
