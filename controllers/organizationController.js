const AppError = require('../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const mailController = require('./mailController');
const { bucket } = require('../utils/firebaseConfig');
const Organization = require('../models/organization');

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

exports.updateProfile = catchAsync(async (req, res, next) => {
  const { name } = req.body;
  const organizationId = req.organization.id;

  if (!name && !req.file) {
    return next(
      new AppError(
        'Please provide either a name or a profile picture to update.',
        400
      )
    );
  }

  const organization = await Organization.findById(organizationId);
  if (!organization) {
    return next(new AppError('Organization not found.', 404));
  }

  let profilePictureUrl;

  if (req.file) {
    const fileName = `profilePictures/${organizationId}_${Date.now()}_${
      req.file.originalname
    }`;
    const file = bucket.file(fileName);

    const blobStream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    await new Promise((resolve, reject) => {
      blobStream.on('error', (error) => {
        reject(new AppError('Failed to upload profile picture.', 500));
      });

      blobStream.on('finish', async () => {
        await file.makePublic();
        profilePictureUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
        resolve();
      });

      blobStream.end(req.file.buffer);
    });
  }

  if (name) organization.name = name;
  if (profilePictureUrl) organization.profilePicture = profilePictureUrl;

  await organization.save();

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully.',
    data: {
      organization,
    },
  });
});
