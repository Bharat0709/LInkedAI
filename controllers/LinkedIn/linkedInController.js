const multer = require('multer');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');
const linkedInService = require('../../services/LinkedIn/linkedinService');
const upload = multer().any();

exports.parseFormData = upload;

exports.shareLinkedInPost = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId;
  const organizationId = req.organization.id;

  if (!organizationId) {
    return next(new AppError('Organization ID is required', 400));
  }

  if (!req.body.content) {
    return next(new AppError('Post content is required', 400));
  }

  if (!req.body.visibility) {
    return next(new AppError('Post visibility is required', 400));
  }

  const result = await linkedInService.shareLinkedInPost(memberId, organizationId, req.body, req.files);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

exports.processScheduledPosts = catchAsync(async (req, res, next) => {
  try {
    const result = await linkedInService.schedulePosts();
    console.log('Scheduled posts processing completed:', result);
  } catch (error) {
    console.error('Error in processScheduledPosts controller:', error);
    return next(new AppError('Failed to process scheduled posts', 500));
  }
});

exports.createScheduledPost = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId;
  const organizationId = req.organization.id;

  if (!organizationId) {
    return next(new AppError('Organization ID is required', 400));
  }

  const scheduledPost = await linkedInService.createScheduledPost(memberId, organizationId, req.body, req.files);

  res.status(201).json({
    status: 'success',
    data: { scheduledPost },
    message: 'Post Scheduled Successfully!',
  });
});

exports.getScheduledPosts = catchAsync(async (req, res, next) => {
  const { memberId: memberId } = req.params;
  const organizationId = req.organization.id;

  if (!organizationId) {
    return next(new AppError('Organization ID is required', 400));
  }

  // Extract query filters
  const filters = {};
  if (req.query.status) {
    filters.status = req.query.status;
  }
  if (req.query.startDate && req.query.endDate) {
    filters.effectivePostTime = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate),
    };
  }

  const scheduledPosts = await linkedInService.getScheduledPosts(memberId, organizationId, filters);

  res.status(200).json({
    status: 'success',
    results: scheduledPosts.length,
    data: { scheduledPosts },
  });
});

exports.updateScheduledPost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const organizationId = req.organization.id;

  if (!organizationId) {
    return next(new AppError('Organization ID is required', 400));
  }

  const updatedPost = await linkedInService.updateScheduledPost(postId, organizationId, req.body, req.files);

  res.status(200).json({
    status: 'success',
    data: { scheduledPost: updatedPost },
  });
});

exports.deleteScheduledPost = catchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const organizationId = req.organization.id;

  if (!organizationId) {
    return next(new AppError('Organization ID is required', 400));
  }

  await linkedInService.deleteScheduledPost(postId, organizationId);

  res.status(200).json({
    status: 'success',
    message: 'Scheduled post deleted successfully',
  });
});

exports.getPostsStatistics = catchAsync(async (req, res, next) => {
  const organizationId = req.organization.id;

  if (!organizationId) {
    return next(new AppError('Organization ID is required', 400));
  }

  const statistics = await linkedInService.getPostsStatistics(organizationId);

  res.status(200).json({
    status: 'success',
    data: { statistics },
  });
});

exports.disconnectLinkedIn = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId;
  const organizationId = req.organization.id;

  await linkedInService.disconnectLinkedIn(memberId, organizationId);

  res.status(200).json({
    status: 'success',
    message: 'Member successfully disconnected from LinkedIn',
  });
});
