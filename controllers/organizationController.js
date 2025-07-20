const organizationService = require('../services/Organization/organizationService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOrganizationById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const organization = await organizationService.getOrganizationById(id);

  res.status(200).json({
    status: 'success',
    data: {
      organization,
    },
  });
});

exports.checkVerificationStatus = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const result = await organizationService.checkVerificationStatus(email);

  res.status(200).json({
    status: 'success',
    isVerified: result,
  });
});

exports.getProfile = catchAsync(async (req, res, next) => {
  const organizationId = req.organization._id;
  const profile = await organizationService.getOrganizationProfile(organizationId);

  res.status(200).json({
    status: 'success',
    profile: profile,
  });
});

exports.updateProfile = catchAsync(async (req, res, next) => {
  const organizationId = req.organization._id;
  const profileData = req.body;
  const file = req.file;

  const updatedOrganization = await organizationService.updateProfile(organizationId, profileData, file);

  res.status(200).json({
    status: 'success',
    data: {
      organization: updatedOrganization,
    },
  });
});

exports.sendHelpRequest = catchAsync(async (req, res, next) => {
  const { helpTextContent } = req.body;
  const organization = req.organization;

  const result = await organizationService.sendHelpRequest(organization, helpTextContent);

  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});

exports.sendFeedback = catchAsync(async (req, res, next) => {
  const { rating, feedbackContent } = req.body;
  const organization = req.organization;

  const result = await organizationService.sendFeedback(organization, rating, feedbackContent);

  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});

exports.deleteOrganization = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { softDelete = true } = req.query;

  await organizationService.deleteOrganization(id, true);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.updateCredits = catchAsync(async (req, res, next) => {
  const organizationId = req.organization._id;
  const { creditsUsed } = req.body;

  if (typeof creditsUsed !== 'number' || creditsUsed < 0) {
    return next(new AppError('Credits used must be a non-negative number.', 400));
  }

  const updatedOrganization = await organizationService.updateCredits(organizationId, creditsUsed);

  res.status(200).json({
    status: 'success',
    data: {
      organization: updatedOrganization,
    },
  });
});

exports.checkTrialStatus = catchAsync(async (req, res, next) => {
  const organizationId = req.organization._id;
  const trialStatus = await organizationService.checkAndUpdateTrialStatus(organizationId);

  res.status(200).json({
    status: 'success',
    data: {
      trialStatus,
    },
  });
});

exports.checkUsageLimits = catchAsync(async (req, res, next) => {
  const organizationId = req.organization._id;
  const { usageType } = req.params;

  const usageCheck = await organizationService.checkUsageLimits(organizationId, usageType);

  res.status(200).json({
    status: 'success',
    data: usageCheck,
  });
});

exports.incrementUsage = catchAsync(async (req, res, next) => {
  const organizationId = req.organization._id;
  const { usageType } = req.params;
  const { amount = 1 } = req.body;

  // Check limits before incrementing
  await organizationService.checkUsageLimits(organizationId, usageType);

  const updatedOrganization = await organizationService.incrementUsage(organizationId, usageType, amount);

  res.status(200).json({
    status: 'success',
    data: {
      organization: updatedOrganization,
    },
  });
});

exports.updateSubscription = catchAsync(async (req, res, next) => {
  const organizationId = req.organization._id;
  const subscriptionData = req.body;

  const updatedOrganization = await organizationService.updateSubscription(organizationId, subscriptionData);

  res.status(200).json({
    status: 'success',
    data: {
      organization: updatedOrganization,
    },
  });
});
