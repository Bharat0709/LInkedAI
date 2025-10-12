// services/automationHistoryService.js
const automationHistoryRepository = require('../../repositories/automationRepository');
const AppError = require('../../utils/appError');
const { getSavedPost } = require('../SavedPost/savedPostService');
const { getMemberById } = require('../Member/memberService');
const { formatTypeCounts, formatStatusCounts, formatDeliveryCounts } = require('./automationHelper');
const { findOrganizationById } = require('../../repositories/aiRepository');
const sendFrostmailEmail = require('../../config/mailConfig');

// Create new Automation
const createAutomation = async (automationData, memberId, organizationId) => {
  if (!memberId) {
    throw new AppError('Unauthorized to perform this action', 401);
  }

  // Verify member exists
  const member = await getMemberById(memberId);
  if (!member || member.organizationId.toString() !== organizationId.toString()) {
    throw new AppError('Member not found or unauthorized', 404);
  }

  // Validate required fields
  if (!automationData.postId || !automationData.emailContent || !automationData.automationType) {
    throw new AppError('Post ID, email content, and automation type are required', 400);
  }

  // Verify the post exists and belongs to the member's organization
  const post = await getSavedPost(automationData.postId);
  if (!post || post.organizationId.toString() !== organizationId.toString()) {
    throw new AppError('Post not found or unauthorized', 404);
  }

  const automationPayload = {
    ...automationData,
    memberId,
    organizationId,
    status: automationData.requireApproval ? 'pending_approval' : 'approved',
    approvalRequiredBy: automationData.requireApproval ? automationData.approvalRequiredBy || memberId : null,
    priority: automationData.priority || 'medium',
  };

  // If scheduled, set scheduling details
  if (automationData.scheduledFor) {
    automationPayload.status = 'scheduled';
    automationPayload.scheduledBy = memberId;
    automationPayload.scheduledDate = new Date();
  }

  return await automationHistoryRepository.create(automationPayload);
};

// Get All Automation of Member
const getAutomations = async (user, memberId, options) => {
  const organizationId = user._id;

  if (!memberId || !organizationId) {
    throw new AppError('Unauthorized to perform this action', 401);
  }
  const member = await getMemberById(memberId);
  if (!member) {
    throw new AppError('Member not found', 404);
  }

  const automations = await automationHistoryRepository.findByMemberId(memberId, options);

  const totalAutomations = await automationHistoryRepository.countByMemberId(memberId, {
    status: options.status !== 'all' ? options.status : undefined,
    automationType: options.automationType !== 'all' ? options.automationType : undefined,
  });

  // Get member-specific filter options and stats
  const stats = await automationHistoryRepository.getMemberStats(memberId);
  const automationTypes = await automationHistoryRepository.getDistinctValuesByMemberId(memberId, 'automationType');
  const priorities = await automationHistoryRepository.getDistinctValuesByMemberId(memberId, 'priority');

  return {
    automations,
    totalAutomations,
    totalPages: Math.ceil(totalAutomations / parseInt(options.limit || 50)),
    currentPage: parseInt(options.page || 1),
    filters: {
      automationTypes,
      priorities,
      statusCounts: formatStatusCounts(stats.statusStats),
      typeCounts: formatTypeCounts(stats.typeStats),
    },
  };
};

// Get Automation By MemberId and AutomationId
const getAutomation = async (automationId, memberId, user) => {
  // Verify member exists
  const organizationId = user._id;

  if (!memberId || !organizationId) {
    throw new AppError('Unauthorized to perform this action', 401);
  }

  // Verify member exists
  const member = await getMemberById(memberId);
  if (!member || member.organizationId.toString() !== organizationId.toString()) {
    throw new AppError('Member not found or unauthorized', 404);
  }

  const automation = await automationHistoryRepository.findByIdAndMemberId(automationId, memberId);

  if (!automation) {
    throw new AppError('Automation not found or you do not have access', 404);
  }

  return automation;
};

// Update Automation By MemberId and AutomationId
const updateAutomation = async (automationId, memberId, updateData, user) => {
  // Verify member exists
  const organizationId = user._id;

  if (!memberId || !organizationId) {
    throw new AppError('Unauthorized to perform this action', 401);
  }

  const member = await getMemberById(memberId);
  if (!member) {
    throw new AppError('Member not found', 404);
  }

  const updatedAutomation = await automationHistoryRepository.updateByIdAndMemberId(automationId, memberId, updateData);

  if (!updatedAutomation) {
    throw new AppError('Automation not found or you do not have permission to update it', 404);
  }

  return updatedAutomation;
};

// Update Automation By MemberId and AutomationId
const updateAutomationStatus = async (automationId, memberId, updateData) => {
  const member = await getMemberById(memberId);
  if (!member) {
    throw new AppError('Member not found', 404);
  }

  const updatedAutomation = await automationHistoryRepository.updateByIdAndMemberId(automationId, memberId, updateData);

  if (!updatedAutomation) {
    throw new AppError('Automation not found or you do not have permission to update it', 404);
  }

  return updatedAutomation;
};

// Open Route to Approve Automation Mail
const approveAutomation = async (automationId, approvedBy) => {
  const automation = await automationHistoryRepository.findById(automationId);
  if (!automation) {
    throw new AppError('Automation not found', 404);
  }

  if (automation.status !== 'pending_approval') {
    throw new AppError('Automation is not pending approval', 400);
  }
  await sendFrostmailEmail('pahwabharat15@gmail.com', automation.emailContent.subject, automation.emailContent.body);
  // Use the model method for approval
  const updateData = {
    adminPass: '12345678',
    deliveryStatus: 'delivered',
  };
  await updateAutomationStatus(automation._id, automation.memberId._id, updateData);
  automation.approve(approvedBy);
  await automation.save();

  return automation;
};

// Open Route to Reject the Automation Mail
const rejectAutomation = async (automationId, rejectedBy, reason = '') => {
  const automation = await automationHistoryRepository.findByIdAndMemberId(automationId, rejectedBy);

  if (!automation) {
    throw new AppError('Automation not found or you do not have access', 404);
  }

  if (automation.status !== 'pending_approval') {
    throw new AppError('Automation is not pending approval', 400);
  }

  // Use the model method for rejection
  automation.reject(rejectedBy, reason);
  await automation.save();

  return automation;
};

// Schedule Automation to Send the Mail Again
const scheduleAutomation = async (automationId, scheduleData, user, scheduledBy) => {
  // Verify member exists
  const organizationId = user._id;

  if (!scheduledBy || !organizationId) {
    throw new AppError('Unauthorized to perform this action', 401);
  }

  const automation = await automationHistoryRepository.findById(automationId);

  if (!automation) {
    throw new AppError('Automation not found', 404);
  }

  // Use the model method for scheduling
  automation.scheduleFor(scheduleData.scheduledFor, scheduleData.timeZone, scheduledBy);

  // Add recurring schedule if provided
  if (scheduleData.isRecurring && scheduleData.recurringSchedule) {
    automation.setupRecurring(scheduleData.recurringSchedule);
  }

  // Add multiple scheduled dates if provided
  if (scheduleData.scheduledDates && scheduleData.scheduledDates.length > 0) {
    automation.addScheduledDates(scheduleData.scheduledDates);
  }

  await automation.save();
  return automation;
};

const getPendingApprovals = async (user, memberId) => {
  const organizationId = user._id;
  const organization = await findOrganizationById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found', 404);
  }
  await getMemberById(memberId);
  return await automationHistoryRepository.findPendingApprovalsByMemberId(memberId);
};

const getScheduledAutomations = async (user, memberId, options = {}) => {
  // Verify member exists
  const organizationId = user._id;
  const organization = await findOrganizationById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found', 404);
  }

  const member = await getMemberById(memberId);
  if (!member) {
    throw new AppError('Member not found', 404);
  }

  return await automationHistoryRepository.findScheduledByMemberId(memberId, options);
};

const getRecurringAutomations = async (user, memberId) => {
  const organizationId = user._id;
  const organization = await findOrganizationById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found', 404);
  }

  const member = await getMemberById(memberId);
  if (!member) {
    throw new AppError('Member not found', 404);
  }

  return await automationHistoryRepository.findRecurringByMemberId(memberId);
};

const getAutomationStats = async (user, timeframe = 'month', memberId) => {
  // Verify member exists
  const organizationId = user._id;

  if (!memberId || !organizationId) {
    throw new AppError('Unauthorized to perform this action', 401);
  }

  // Verify member exists
  const member = await getMemberById(memberId);
  if (!member || member.organizationId.toString() !== organizationId.toString()) {
    throw new AppError('Member not found or unauthorized', 404);
  }

  const stats = await automationHistoryRepository.getMemberStats(memberId, timeframe);
  const performanceMetrics = await automationHistoryRepository.getMemberPerformanceMetrics(memberId);

  return {
    statusCounts: formatStatusCounts(stats.statusStats),
    typeCounts: formatTypeCounts(stats.typeStats),
    deliveryCounts: formatDeliveryCounts(stats.deliveryStats),
    totalAutomations: stats.totalAutomations,
    performance: performanceMetrics[0] || {
      totalSent: 0,
      avgOpenRate: 0,
      avgClickRate: 0,
      avgReplyRate: 0,
      totalReplies: 0,
    },
  };
};

const bulkApproveAutomations = async (automationIds, approvedBy, user) => {
  if (!Array.isArray(automationIds) || automationIds.length === 0) {
    throw new AppError('Automation IDs are required', 400);
  }

  // Verify permissions for all automations
  const automations = await Promise.all(automationIds.map(id => automationHistoryRepository.findById(id)));

  const hasPermission = automations.every(automation => automation && automation.organizationId._id.toString() === user._id.toString() && automation.status === 'pending_approval');

  if (!hasPermission) {
    throw new AppError('You do not have permission to approve some of these automations', 403);
  }

  const updateData = {
    status: 'approved',
    approvedBy: approvedBy,
    approvalDate: new Date(),
  };

  await automationHistoryRepository.bulkUpdateByMemberId(automationIds, approvedBy, updateData);

  return { message: `${automationIds.length} automations approved successfully` };
};

const bulkRejectAutomations = async (automationIds, rejectedBy, reason, user) => {
  if (!Array.isArray(automationIds) || automationIds.length === 0) {
    throw new AppError('Automation IDs are required', 400);
  }

  // Verify permissions for all automations
  const automations = await Promise.all(automationIds.map(id => automationHistoryRepository.findById(id)));

  const hasPermission = automations.every(automation => automation && automation.organizationId._id.toString() === user.organizationId.toString() && automation.status === 'pending_approval');

  if (!hasPermission) {
    throw new AppError('You do not have permission to reject some of these automations', 403);
  }

  const updateData = {
    status: 'rejected',
    rejectedBy: rejectedBy,
    rejectionDate: new Date(),
    rejectionReason: reason,
  };

  await automationHistoryRepository.bulkUpdate(automationIds, updateData);

  return { message: `${automationIds.length} automations rejected successfully` };
};

const bulkCancelAutomations = async (automationIds, user) => {
  if (!Array.isArray(automationIds) || automationIds.length === 0) {
    throw new AppError('Automation IDs are required', 400);
  }

  // Verify permissions and that automations can be cancelled
  const automations = await Promise.all(automationIds.map(id => automationHistoryRepository.findById(id)));

  const hasPermission = automations.every(automation => automation && automation.organizationId._id.toString() === user.organizationId.toString() && ['scheduled', 'approved'].includes(automation.status));

  if (!hasPermission) {
    throw new AppError('You do not have permission to cancel some of these automations', 403);
  }

  const updateData = {
    status: 'rejected',
    rejectionReason: 'Cancelled by user',
    rejectionDate: new Date(),
  };

  await automationHistoryRepository.bulkUpdate(automationIds, updateData);

  return { message: `${automationIds.length} automations cancelled successfully` };
};

const bulkRetryAutomations = async (automationIds, user) => {
  if (!Array.isArray(automationIds) || automationIds.length === 0) {
    throw new AppError('Automation IDs are required', 400);
  }

  // Verify permissions and that automations can be retried
  const automations = await Promise.all(automationIds.map(id => automationHistoryRepository.findById(id)));

  const hasPermission = automations.every(automation => automation && automation.organizationId._id.toString() === user.organizationId.toString() && automation.status === 'failed');

  if (!hasPermission) {
    throw new AppError('You do not have permission to retry some of these automations', 403);
  }

  const updateData = {
    status: 'approved',
    retryCount: { $inc: 1 },
    errorMessage: '',
  };

  await automationHistoryRepository.bulkUpdate(automationIds, updateData);

  return { message: `${automationIds.length} automations queued for retry` };
};

const deleteAutomation = async (automationId, memberId, user) => {
  // Verify member exists
  const organizationId = user._id;

  if (!memberId || !organizationId) {
    throw new AppError('Unauthorized to perform this action', 401);
  }

  const member = await getMemberById(memberId);
  if (!member) {
    throw new AppError('Member not found', 404);
  }

  const deletedAutomation = await automationHistoryRepository.deleteByIdAndMemberId(automationId, memberId);

  if (!deletedAutomation) {
    throw new AppError('Automation not found or you do not have permission to delete it', 404);
  }

  return deletedAutomation;
};

module.exports = {
  // Create
  createAutomation,

  // Read
  getAutomations,
  getAutomation,
  getPendingApprovals,
  getScheduledAutomations,
  getRecurringAutomations,
  getAutomationStats,

  // Update
  updateAutomation,
  updateAutomationStatus,
  approveAutomation,
  rejectAutomation,
  scheduleAutomation,

  // Bulk Operations
  bulkApproveAutomations,
  bulkRejectAutomations,
  bulkCancelAutomations,
  bulkRetryAutomations,

  // Delete
  deleteAutomation,
};
