const savedPostService = require('../../services/SavedPost/savedPostService');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');

exports.createSavedPost = catchAsync(async (req, res, next) => {
  const user = req.member;
  const savedPost = await savedPostService.createSavedPost(req.body, user);

  res.status(201).json({
    status: 'success',
    data: savedPost,
  });
});

exports.getSavedPosts = catchAsync(async (req, res, next) => {
  const user = req.organization;
  const organizationId = user.id;

  const options = {
    status: req.query.status,
    category: req.query.category,
    priority: req.query.priority,
    sortBy: req.query.sortBy || 'createdAt',
    order: req.query.order || 'desc',
    limit: req.query.limit || 50,
    page: req.query.page || 1,
    search: req.query.search,
    memberId: req.query.memberId,
    tags: req.query.tags ? req.query.tags.split(',') : [],
  };

  const result = await savedPostService.getSavedPosts(organizationId, options);

  res.status(200).json({
    status: 'success',
    results: result.posts.length,
    totalResults: result.totalResults,
    totalPages: result.totalPages,
    currentPage: result.currentPage,
    data: result.posts,
    filters: result.filters,
  });
});

exports.updateSavedPost = catchAsync(async (req, res, next) => {
  const postId = req.params.id;
  const { updateData } = req.body;
  const user = req.organization;

  const updatedPost = await savedPostService.updateSavedPost(postId, updateData, user);

  res.status(200).json({
    status: 'success',
    data: updatedPost,
  });
});

exports.getSavedPostStats = catchAsync(async (req, res, next) => {
  const user = req.organization;
  const organizationId = user.id;
  const { timeframe = 'month', memberId } = req.query;

  const stats = await savedPostService.getSavedPostStats(organizationId, timeframe, memberId);

  res.status(200).json({
    status: 'success',
    data: {
      userStats: stats,
    },
  });
});

exports.getOrganizationSavedPosts = catchAsync(async (req, res, next) => {
  const { organizationId } = req.params;
  console.log(req.params);
  const user = req.member;

  // Ensure user belongs to this organization or is admin
  if (user.organizationId.toString() !== organizationId && !['admin', 'owner'].includes(user.role)) {
    return next(new AppError('You do not have permission to access these posts', 403));
  }

  const options = {
    status: req.query.status,
    category: req.query.category,
    priority: req.query.priority,
    memberId: req.query.memberId,
    sortBy: req.query.sortBy || 'createdAt',
    order: req.query.order || 'desc',
    limit: req.query.limit || 50,
    page: req.query.page || 1,
    search: req.query.search,
  };

  const result = await savedPostService.getSavedPosts(organizationId, options);

  res.status(200).json({
    status: 'success',
    results: result.posts.length,
    totalResults: result.totalResults,
    totalPages: result.totalPages,
    currentPage: result.currentPage,
    data: result.posts,
  });
});

exports.getSavedPost = catchAsync(async (req, res, next) => {
  const postId = req.params.id;
  const user = req.member;

  const savedPost = await savedPostService.getSavedPost(postId, user);

  res.status(200).json({
    status: 'success',
    data: savedPost,
  });
});

exports.updateSavedPostStatus = catchAsync(async (req, res, next) => {
  const postId = req.params.id;
  const { status } = req.body;
  const user = req.member;

  const updatedPost = await savedPostService.updateStatus(postId, status, user);

  res.status(200).json({
    status: 'success',
    data: updatedPost,
  });
});

exports.updateSavedPostNotes = catchAsync(async (req, res, next) => {
  const postId = req.params.id;
  const { notes } = req.body;
  const user = req.member;

  const updatedPost = await savedPostService.updateSavedPost(postId, { notes }, user);

  res.status(200).json({
    status: 'success',
    data: updatedPost,
  });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const postId = req.params.id;
  const { category } = req.body;
  const user = req.member;

  if (!category) {
    return next(new AppError('Category is required', 400));
  }

  const updatedPost = await savedPostService.updateSavedPost(postId, { category }, user);

  res.status(200).json({
    status: 'success',
    data: updatedPost,
  });
});

exports.updatePriority = catchAsync(async (req, res, next) => {
  const postId = req.params.id;
  const { priority } = req.body;
  const user = req.member;

  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  if (!validPriorities.includes(priority)) {
    return next(new AppError('Invalid priority value', 400));
  }

  const updatedPost = await savedPostService.updateSavedPost(postId, { leadPriority: priority }, user);

  res.status(200).json({
    status: 'success',
    data: updatedPost,
  });
});

exports.updateTags = catchAsync(async (req, res, next) => {
  const postId = req.params.id;
  const { tags } = req.body;
  const user = req.member;

  if (!Array.isArray(tags)) {
    return next(new AppError('Tags must be an array', 400));
  }

  const updatedPost = await savedPostService.updateSavedPost(postId, { tags }, user);

  res.status(200).json({
    status: 'success',
    data: updatedPost,
  });
});

exports.updateFollowUpDate = catchAsync(async (req, res, next) => {
  const postId = req.params.id;
  const { followUpDate } = req.body;
  const user = req.member;

  if (!followUpDate) {
    return next(new AppError('Follow-up date is required', 400));
  }

  const updatedPost = await savedPostService.updateSavedPost(postId, { followUpDate: new Date(followUpDate) }, user);

  res.status(200).json({
    status: 'success',
    data: updatedPost,
  });
});

exports.updateEmailContent = catchAsync(async (req, res, next) => {
  const postId = req.params.id;
  const { emailSubject, emailBody } = req.body;
  if (!emailSubject || !emailBody) {
    return next(new AppError('Required Data is missing', 400));
  }
  const updatedData = {
    generatedEmailBody: emailBody,
    generatedSubject: emailSubject,
  };

  const updatedPost = await savedPostService.updateGeneratedEmail(postId, updatedData);

  res.status(200).json({
    status: 'success',
    data: updatedPost,
  });
});

exports.updateLeadInfo = catchAsync(async (req, res, next) => {
  const postId = req.params.id;
  const { leadValue, companySize, budget, timeline } = req.body;
  const user = req.member;

  const updateData = {};
  if (leadValue !== undefined) updateData.leadValue = leadValue;
  if (companySize) updateData.companySize = companySize;
  if (budget) updateData.budget = budget;
  if (timeline) updateData.timeline = timeline;

  const updatedPost = await savedPostService.updateSavedPost(postId, updateData, user);

  res.status(200).json({
    status: 'success',
    data: updatedPost,
  });
});

exports.deleteSavedPost = catchAsync(async (req, res, next) => {
  const postId = req.params.id;
  const user = req.organization;

  await savedPostService.deleteSavedPost(postId, user);

  res.status(204).send();
});

exports.bulkUpdateSavedPosts = catchAsync(async (req, res, next) => {
  const { postIds, updateData } = req.body;
  const user = req.member;

  const result = await savedPostService.bulkUpdatePosts(postIds, updateData, user);

  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});

exports.getMembersWithSavedPosts = catchAsync(async (req, res, next) => {
  const user = req.member;
  const { timeframe = 'all' } = req.query;

  const memberStats = await savedPostService.getMembersWithSavedPosts(user.organizationId, timeframe);

  res.status(200).json({
    status: 'success',
    data: memberStats,
  });
});

exports.getDuePosts = catchAsync(async (req, res, next) => {
  const user = req.organization;
  const organizationId = user.id;

  const duePosts = await savedPostService.getDuePosts(organizationId);

  res.status(200).json({
    status: 'success',
    results: duePosts.length,
    data: duePosts,
  });
});

exports.getExpiringPosts = catchAsync(async (req, res, next) => {
  const user = req.organization;
  const organizationId = user.id;
  const { days = 7 } = req.query;

  const expiringPosts = await savedPostService.getExpiringPosts(organizationId, parseInt(days));

  res.status(200).json({
    status: 'success',
    results: expiringPosts.length,
    data: expiringPosts,
  });
});

exports.bulkUpdateStatus = catchAsync(async (req, res, next) => {
  const { postIds, status } = req.body;
  const user = req.organization;
  if (!Array.isArray(postIds) || postIds.length === 0) {
    return next(new AppError('Post IDs are required', 400));
  }

  const validStatuses = ['new', 'contacted', 'responded', 'qualified', 'converted', 'closed', 'rejected'];
  if (!validStatuses.includes(status)) {
    return next(new AppError('Invalid status value', 400));
  }

  const result = await savedPostService.bulkUpdateStatus(postIds, status, user);

  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});

exports.bulkUpdatePriority = catchAsync(async (req, res, next) => {
  if (!req.body || !req.body.postIds || !req.body.priority) {
    return next(new AppError('Post IDs and priority are required', 400));
  }
  const { postIds, priority } = req.body;
  const user = req.organization;

  if (!Array.isArray(postIds) || postIds.length === 0) {
    return next(new AppError('Post IDs are required', 400));
  }

  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  if (!validPriorities.includes(priority)) {
    return next(new AppError('Invalid priority value', 400));
  }

  const result = await savedPostService.bulkUpdatePriority(postIds, priority, user);

  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});

exports.bulkUpdateAutomation = catchAsync(async (req, res, next) => {
  const { postIds, automationData } = req.body;
  const user = req.organization;

  if (!Array.isArray(postIds) || postIds.length === 0) {
    return next(new AppError('Post IDs are required', 400));
  }

  if (!automationData) {
    return next(new AppError('Automation data is required', 400));
  }

  // Validate automation data
  const validAutomationEnabled = ['none', 'semi', 'full'];
  const validPersonalizationLevel = ['basic', 'medium', 'high'];

  if (automationData.automationEnabled && !validAutomationEnabled.includes(automationData.automationEnabled)) {
    return next(new AppError('Invalid automation enabled value', 400));
  }

  if (automationData.personalizationLevel && !validPersonalizationLevel.includes(automationData.personalizationLevel)) {
    return next(new AppError('Invalid personalization level', 400));
  }

  const result = await savedPostService.bulkUpdateAutomation(postIds, automationData, user);

  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});

exports.bulkDeleteSavedPosts = catchAsync(async (req, res, next) => {
  const { postIds } = req.body;
  const user = req.organization;

  if (!Array.isArray(postIds) || postIds.length === 0) {
    return next(new AppError('Post IDs are required', 400));
  }

  const result = await savedPostService.bulkDeletePosts(postIds, user);

  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});
