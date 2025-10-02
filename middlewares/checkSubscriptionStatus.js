// middlewares/checkSubscriptionStatus.js
const organizationService = require('../services/Organization/organizationService');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.checkSubscriptionStatus = catchAsync(async (req, res, next) => {
  let orgId;
  if (req.member) {
    orgId = req?.member?.organizationId;
  } else if (req.organization) {
    orgId = req.organization._id;
  } else {
    return next(new AppError('You are not authorized to access this resource.', 401));
  }

  console.log(orgId);

  const organization = await organizationService.getOrganizationById(orgId);

  if (!organization) {
    return next(new AppError('Organization not found', 401));
  }

  // 1. Check if organization is verified
  if (!organization.isVerified) {
    return next(new AppError('Organization email is not verified.', 403));
  }

  const { subscription } = organization;
  console.log(subscription);

  if (!subscription || !subscription.plan || !subscription.status) {
    return next(new AppError('Organization subscription details are missing.', 403));
  }

  const { plan, status, trialEndDate, renewalDate } = subscription;

  // 2. Handle trial logic
  if (plan === 'trial') {
    const now = Date.now();

    if (!trialEndDate || now > new Date(trialEndDate).getTime()) {
      organization.subscription.status = 'expired';
      return next(new AppError('Your trial has expired. Please upgrade to perform this action.', 403));
    }

    return next();
  }

  // 3. Handle paid plans (pro, enterprise)
  if (['pro', 'enterprise'].includes(plan)) {
    if (status !== 'active') {
      return next(new AppError(`Your subscription is ${status}. Please renew to continue.`, 403));
    }

    if (renewalDate && Date.now() > new Date(renewalDate).getTime()) {
      organization.subscription.status = 'expired';
      return next(new AppError('Your subscription has expired. Please renew.', 403));
    }

    return next();
  }
  return next();
});
