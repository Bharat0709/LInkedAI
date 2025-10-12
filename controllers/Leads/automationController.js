// controllers/automationHistoryController.js
const automationHistoryService = require('../../services/Automation/automationService');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');

// Create new automation - DONE
exports.createAutomation = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId;
  const organizationId = req.params.organizationId;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const { adminPass } = req.body;
  if (adminPassword != adminPass) {
    return next(new AppError('You are not authorized to perform this action', 400));
  }
  const automation = await automationHistoryService.createAutomation(req.body, memberId, organizationId);
  res.status(201).json({
    status: 'success',
    data: automation,
  });
});

// Get all automations for organization - DONE
exports.getAutomations = catchAsync(async (req, res, next) => {
  const user = req.organization;
  const { memberId } = req.params;

  const options = {
    status: req.query.status,
    automationType: req.query.automationType,
    priority: req.query.priority,
    deliveryStatus: req.query.deliveryStatus,
    sortBy: req.query.sortBy || 'createdAt',
    order: req.query.order || 'desc',
    limit: req.query.limit || 50,
    page: req.query.page || 1,
    search: req.query.search,
    isRecurring: req.query.isRecurring,
  };

  const result = await automationHistoryService.getAutomations(user, memberId, options);

  res.status(200).json({
    status: 'success',
    results: result.automations.length,
    totalPages: result.totalPages,
    currentPage: result.currentPage,
    data: result.automations,
    filters: result.filters,
  });
});

// Get single automation by ID - DONE
exports.getAutomation = catchAsync(async (req, res, next) => {
  const automationId = req.params.id;
  const memberId = req.params.memberId;
  const user = req.organization;
  const automation = await automationHistoryService.getAutomation(automationId, memberId, user);

  res.status(200).json({
    status: 'success',
    data: automation,
  });
});

// Update automation - DONE
exports.updateAutomation = catchAsync(async (req, res, next) => {
  const automationId = req.params.id;
  const { updateData } = req.body;
  const memberId = req.params.memberId;
  const user = req.organization;

  const updatedAutomation = await automationHistoryService.updateAutomation(automationId, memberId, updateData, user);

  res.status(200).json({
    status: 'success',
    data: updatedAutomation,
  });
});

// Approve automation - DONE
exports.approveAutomation = catchAsync(async (req, res, next) => {
  const automationId = req.params.id;
  const memberId = req.params.memberId;

  const automation = await automationHistoryService.approveAutomation(automationId, memberId);

  res.status(200).json({
    status: 'success',
    message: 'Automation approved successfully',
    data: automation,
  });
});

// Reject automation - DONE
exports.rejectAutomation = catchAsync(async (req, res, next) => {
  const automationId = req.params.id;
  const { reason } = req.body;
  const memberId = req.params.memberId;

  if (!reason) {
    return next(new AppError('Rejection reason is required', 400));
  }

  const automation = await automationHistoryService.rejectAutomation(automationId, memberId, reason);

  res.status(200).json({
    status: 'success',
    message: 'Automation rejected successfully',
    data: automation,
  });
});

// Get pending approvals - DONE
exports.getPendingApprovals = catchAsync(async (req, res, next) => {
  const user = req.organization;
  const memberId = req.params.memberId;

  const pendingApprovals = await automationHistoryService.getPendingApprovals(user, memberId);

  res.status(200).json({
    status: 'success',
    results: pendingApprovals.length,
    data: pendingApprovals,
  });
});

// Schedule automation - Done
exports.scheduleAutomation = catchAsync(async (req, res, next) => {
  const automationId = req.params.id;
  const scheduleData = req.body;
  const memberId = req.params.memberId;
  const user = req.organization;

  if (!scheduleData.scheduledFor) {
    return next(new AppError('Scheduled date/time is required', 400));
  }

  const automation = await automationHistoryService.scheduleAutomation(automationId, scheduleData, user, memberId);

  res.status(200).json({
    status: 'success',
    message: 'Automation scheduled successfully',
    data: automation,
  });
});

// Get scheduled automations - DONE
exports.getScheduledAutomations = catchAsync(async (req, res, next) => {
  const user = req.organization;
  const { upcoming = true, overdue = false } = req.query;
  const memberId = req.params.memberId;
  const scheduledAutomations = await automationHistoryService.getScheduledAutomations(user, memberId, {
    upcoming: upcoming === 'true',
    overdue: overdue === 'true',
  });

  res.status(200).json({
    status: 'success',
    results: scheduledAutomations.length,
    data: scheduledAutomations,
  });
});

// Get recurring automations - DONE
exports.getRecurringAutomations = catchAsync(async (req, res, next) => {
  const user = req.organization;
  const memberId = req.params.memberId;

  const recurringAutomations = await automationHistoryService.getRecurringAutomations(user, memberId);

  res.status(200).json({
    status: 'success',
    results: recurringAutomations.length,
    data: recurringAutomations,
  });
});

// Get automation statistics - Pending
exports.getAutomationStats = catchAsync(async (req, res, next) => {
  const user = req.organization;
  const memberId = req.params.memberId;

  const { timeframe = 'month' } = req.query;

  const stats = await automationHistoryService.getAutomationStats(user, timeframe, memberId);

  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

// Bulk approve automations
exports.bulkApproveAutomations = catchAsync(async (req, res, next) => {
  const { automationIds } = req.body;
  const user = req.organization;
  const memberId = req.params.memberId;

  if (!Array.isArray(automationIds) || automationIds.length === 0) {
    return next(new AppError('Automation IDs are required', 400));
  }

  const result = await automationHistoryService.bulkApproveAutomations(automationIds, memberId, user);

  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});

// Bulk reject automations
exports.bulkRejectAutomations = catchAsync(async (req, res, next) => {
  const { automationIds, reason } = req.body;
  const user = req.member;

  if (!Array.isArray(automationIds) || automationIds.length === 0) {
    return next(new AppError('Automation IDs are required', 400));
  }

  if (!reason) {
    return next(new AppError('Rejection reason is required', 400));
  }

  const result = await automationHistoryService.bulkRejectAutomations(automationIds, user._id, reason, user);

  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});

// Bulk cancel automations
exports.bulkCancelAutomations = catchAsync(async (req, res, next) => {
  const { automationIds } = req.body;
  const user = req.organization;

  if (!Array.isArray(automationIds) || automationIds.length === 0) {
    return next(new AppError('Automation IDs are required', 400));
  }

  const result = await automationHistoryService.bulkCancelAutomations(automationIds, user);

  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});

// Bulk retry failed automations
exports.bulkRetryAutomations = catchAsync(async (req, res, next) => {
  const { automationIds } = req.body;
  const user = req.organization;

  if (!Array.isArray(automationIds) || automationIds.length === 0) {
    return next(new AppError('Automation IDs are required', 400));
  }

  const result = await automationHistoryService.bulkRetryAutomations(automationIds, user);

  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});

// Delete automation - Done
exports.deleteAutomation = catchAsync(async (req, res, next) => {
  const automationId = req.params.id;
  const memberId = req.params.memberId;
  const user = req.organization;

  await automationHistoryService.deleteAutomation(automationId, memberId, user);

  res.status(204).send();
});

// Update automation status (for workflow management) - Done
exports.updateAutomationStatus = catchAsync(async (req, res, next) => {
  const automationId = req.params.id;
  const memberId = req.params.memberId;
  const { status, adminPass } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword != adminPass) {
    return next(new AppError('You are not authorized to perform this action', 400));
  }
  const validStatuses = ['pending_approval', 'approved', 'rejected', 'sent', 'failed', 'scheduled'];
  if (!validStatuses.includes(status)) {
    return next(new AppError('Invalid status value', 400));
  }

  let updateData = { status };
  if (status === 'failed') {
    updateData = { ...updateData, deliveryStatus: 'failed', sentAt: new Date() };
  }

  const updatedAutomation = await automationHistoryService.updateAutomationStatus(automationId, memberId, updateData);

  res.status(200).json({
    status: 'success',
    data: updatedAutomation,
  });
});

// Update automation priority - Pending
exports.updateAutomationPriority = catchAsync(async (req, res, next) => {
  const automationId = req.params.id;
  const { priority } = req.body;
  const user = req.member;

  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  if (!validPriorities.includes(priority)) {
    return next(new AppError('Invalid priority value', 400));
  }

  const updatedAutomation = await automationHistoryService.updateAutomation(automationId, { priority }, user);

  res.status(200).json({
    status: 'success',
    data: updatedAutomation,
  });
});

// Get overdue scheduled automations - Pending
exports.getOverdueAutomations = catchAsync(async (req, res, next) => {
  const user = req.organization;
  const organizationId = user.id;

  const overdueAutomations = await automationHistoryService.getScheduledAutomations(organizationId, {
    upcoming: false,
    overdue: true,
  });

  res.status(200).json({
    status: 'success',
    results: overdueAutomations.length,
    data: overdueAutomations,
  });
});

// Get automations due for execution (for background jobs) - Pending
exports.getDueAutomations = catchAsync(async (req, res, next) => {
  const user = req.organization;
  const organizationId = user.id;
  const { limit = 100 } = req.query;

  // This would typically be used by background job processors
  const dueAutomations = await automationHistoryService.getScheduledAutomations(organizationId, {
    upcoming: false,
    overdue: true,
  });

  res.status(200).json({
    status: 'success',
    results: dueAutomations.length,
    data: dueAutomations.slice(0, parseInt(limit)),
  });
});

// Reschedule automation
exports.rescheduleAutomation = catchAsync(async (req, res, next) => {
  const automationId = req.params.id;
  const { scheduledFor, reason, timeZone } = req.body;
  const user = req.member;

  if (!scheduledFor) {
    return next(new AppError('New scheduled date/time is required', 400));
  }

  const scheduleData = {
    scheduledFor,
    timeZone: timeZone || 'UTC',
  };

  const automation = await automationHistoryService.scheduleAutomation(automationId, scheduleData, user._id);

  res.status(200).json({
    status: 'success',
    message: 'Automation rescheduled successfully',
    data: automation,
  });
});

// Update delivery status (for email service webhooks) - Done
exports.updateDeliveryStatus = catchAsync(async (req, res, next) => {
  const automationId = req.params.id;
  const memberId = req.params.memberId;
  const { deliveryStatus, adminPass } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword != adminPass) {
    return next(new AppError('You are not authorized to perform this action', 400));
  }
  const validDeliveryStatuses = ['pending', 'delivered', 'bounced', 'failed', 'opened', 'clicked'];
  if (!validDeliveryStatuses.includes(deliveryStatus)) {
    return next(new AppError('Invalid delivery status value', 400));
  }

  let updateData = { deliveryStatus };
  if (deliveryStatus === 'delivered') {
    updateData = { ...updateData, status: 'sent', sentAt: new Date() };
  }

  const updatedAutomation = await automationHistoryService.updateAutomationStatus(automationId, memberId, updateData);

  res.status(200).json({
    status: 'success',
    data: updatedAutomation,
  });
});
