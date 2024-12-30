const AppError = require('../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const mailController = require('./mailController');

exports.sendHelpRequest = catchAsync(async (req, res, next) => {
  const { helpTextContent } = req.body;

  if (!helpTextContent) {
    return next(new AppError('Please provide the help text content.', 400));
  }

  const organization = req.organization;

  if (!organization || !organization.email) {
    return next(new AppError('Organization details are missing.', 404));
  }

  await mailController.helpRequest(organization, helpTextContent);

  res.status(200).json({
    status: 'success',
    message: 'Help request has been sent successfully.',
  });
});

exports.Organizationfeedback = catchAsync(async (req, res, next) => {
  const { feedbackContent, rating } = req.body;

  if (!feedbackContent) {
    return next(new AppError('Please provide the help text content.', 400));
  }

  const organization = req.organization;

  if (!organization || !organization.email) {
    return next(new AppError('Organization details are missing.', 404));
  }

  await mailController.feedback(organization, rating, feedbackContent);

  res.status(200).json({
    status: 'success',
    message: 'Feeback has been sent successfully.',
  });
});
