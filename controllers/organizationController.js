const organizationService = require('../services/Organization/organizationService');
const catchAsync = require('../utils/catchAsync');

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
  console.log(helpTextContent);
  const organization = req.organization;
  const result = await organizationService.sendHelpRequest(organization, helpTextContent);
console.log(result)
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

