const catchAsync = require('../utils/catchAsync');
const organizationRepository = require('../repositories/organizationRepository');
const AppError = require('../utils/appError');

const checkContentCalendarLimit = catchAsync(async (req, res, next) => {
  const organizationId = req.organization.id;

  // Get current organization data
  const organization = await organizationRepository.findById(organizationId);

  if (!organization) {
    return next(new AppError('Organization not found', 404));
  }

  const { monthlyUsage } = organization.planUsage;
  const currentContentCalendarEntries = monthlyUsage.contentCalendarDaysAdded || 0;
  const maxContentCalendarEntriesPerMonth = monthlyUsage.maxContentCalendarDays || 0;

  const { calendarData } = req.body;
  // For bulk add, check if adding multiple entries would exceed limit
  let entriesToAdd = calendarData.length;

  // Check if limit would be exceeded
  if (currentContentCalendarEntries + entriesToAdd > maxContentCalendarEntriesPerMonth) {
    return next(new AppError(`Content calendar limit reached. You can add up to ${maxContentCalendarEntriesPerMonth} entries per month. Current: ${currentContentCalendarEntries}`, 403));
  }

  next();
});

const incrementContentCalendarCount = catchAsync(async (organizationId, count = 1) => {
  // Get current organization data
  const organization = await organizationRepository.findById(organizationId);

  if (!organization) {
    throw new AppError('Organization not found', 404);
  }

  let updateQuery = {};

  updateQuery['$inc'] = {
    'planUsage.monthlyUsage.contentCalendarDaysAdded': count,
  };

  await organizationRepository.updateById(organizationId, updateQuery);
});

const decrementContentCalendarCount = catchAsync(async (organizationId, count = 1) => {
  // Get current organization data
  const organization = await organizationRepository.findById(organizationId);

  if (!organization) {
    throw new AppError('Organization not found', 404);
  }

  let updateQuery = {};

  updateQuery['$inc'] = {
    'planUsage.monthlyUsage.contentCalendarDaysAdded': -count,
  };

  await organizationRepository.updateById(organizationId, updateQuery);
});

module.exports = {
  checkContentCalendarLimit,
  incrementContentCalendarCount,
  decrementContentCalendarCount,
};
