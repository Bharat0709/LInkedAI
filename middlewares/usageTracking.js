const catchAsync = require('../utils/catchAsync');
const organizationRepository = require('../repositories/organizationRepository');
const AppError = require('../utils/appError');

const checkPostScheduleLimit = catchAsync(async (req, res, next) => {
  const organizationId = req.organization.id;

  // Get current organization data
  const organization = await organizationRepository.findById(organizationId);

  if (!organization) {
    return next(new AppError('Organization not found', 404));
  }

  const { monthlyUsage } = organization.planUsage;
  const currentPostsScheduled = monthlyUsage.postsScheduled || 0;
  const maxPostsScheduledPerMonth = monthlyUsage.maxPostsScheduledPerMonth || 0;

  // Check if limit reached
  if (currentPostsScheduled >= maxPostsScheduledPerMonth) {
    return next(new AppError(`Posts limit reached. You can schedule/post/draft up to ${maxPostsScheduledPerMonth} posts.`, 403));
  }

  next();
});

const incrementPostedCount = catchAsync(async organizationId => {
  // Get current organization data
  const organization = await organizationRepository.findById(organizationId);

  if (!organization) {
    throw new AppError('Organization not found', 404);
  }

  let updateQuery = {};

  updateQuery['$inc'] = {
    'planUsage.monthlyUsage.postsScheduled': 1,
  };

  await organizationRepository.updateById(organizationId, updateQuery);
});

module.exports = {
  checkPostScheduleLimit,
  incrementPostedCount,
};
