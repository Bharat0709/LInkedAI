// repositories/automationHistoryRepository.js - Member-Centric Approach
const AutomationHistory = require('../models/automations');

// PRIMARY: Find by Member ID (main access pattern)
const findByMemberId = async (memberId, options = {}) => {
  const { status, automationType, priority, deliveryStatus, sortBy = 'createdAt', order = 'desc', limit = 50, page = 1, search, isRecurring } = options;

  let query = { memberId };

  // Apply filters
  if (status && status !== 'all') {
    query.status = status;
  }

  if (automationType && automationType !== 'all') {
    query.automationType = automationType;
  }

  if (priority && priority !== 'all') {
    query.priority = priority;
  }

  if (deliveryStatus && deliveryStatus !== 'all') {
    query.deliveryStatus = deliveryStatus;
  }

  if (isRecurring !== undefined) {
    query.isRecurring = isRecurring;
  }

  // Search functionality
  if (search) {
    query.$or = [
      { 'emailContent.to': { $regex: search, $options: 'i' } },
      { 'emailContent.subject': { $regex: search, $options: 'i' } },
      { templateName: { $regex: search, $options: 'i' } },
      { automationType: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  let sort = {};
  sort[sortBy] = order === 'desc' ? -1 : 1;

  return await AutomationHistory.find(query)
    .populate('postId', 'content author')
    .populate('templateId', 'name')
    .populate('organizationId', 'name')
    .populate('approvedBy', 'name email')
    .populate('rejectedBy', 'name email')
    .populate('scheduledBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));
};

// Count automations for a specific member
const countByMemberId = async (memberId, filters = {}) => {
  let query = { memberId, ...filters };
  return await AutomationHistory.countDocuments(query);
};

// Find single automation by ID and Member ID (for security)
const findByIdAndMemberId = async (automationId, memberId) => {
  return await AutomationHistory.findOne({ _id: automationId, memberId })
    .populate('postId', 'content author')
    .populate('templateId', 'name')
    .populate('organizationId', 'name')
    .populate('approvedBy', 'name email')
    .populate('rejectedBy', 'name email')
    .populate('scheduledBy', 'name email');
};

// Create automation (always with memberId)
const create = async automationData => {
  if (!automationData.memberId) {
    throw new Error('Member ID is required for automation creation');
  }

  const automation = new AutomationHistory(automationData);
  return await automation.save();
};

// Update automation by ID and Member ID (for security)
const updateByIdAndMemberId = async (automationId, memberId, updateData) => {
  return await AutomationHistory.findOneAndUpdate({ _id: automationId, memberId }, updateData, { new: true, runValidators: true });
};

// Delete automation by ID and Member ID (for security)
const deleteByIdAndMemberId = async (automationId, memberId) => {
  return await AutomationHistory.findOneAndDelete({ _id: automationId, memberId });
};

// Bulk update for member's automations only
const bulkUpdateByMemberId = async (automationIds, memberId, updateData) => {
  return await AutomationHistory.updateMany({ _id: { $in: automationIds }, memberId }, { $set: { ...updateData, updatedAt: Date.now() } });
};

// Bulk delete for member's automations only
const bulkDeleteByMemberId = async (automationIds, memberId) => {
  return await AutomationHistory.deleteMany({ _id: { $in: automationIds }, memberId });
};

// Get member's automation statistics
const getMemberStats = async (memberId, timeframe = 'all') => {
  let dateFilter = {};
  const now = new Date();

  if (timeframe === 'week') {
    const lastWeek = new Date(now);
    lastWeek.setDate(now.getDate() - 7);
    dateFilter = { createdAt: { $gte: lastWeek } };
  } else if (timeframe === 'month') {
    const lastMonth = new Date(now);
    lastMonth.setMonth(now.getMonth() - 1);
    dateFilter = { createdAt: { $gte: lastMonth } };
  } else if (timeframe === 'year') {
    const lastYear = new Date(now);
    lastYear.setFullYear(now.getFullYear() - 1);
    dateFilter = { createdAt: { $gte: lastYear } };
  }

  const baseQuery = { memberId, ...dateFilter };

  const statusStats = await AutomationHistory.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const typeStats = await AutomationHistory.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: '$automationType',
        count: { $sum: 1 },
      },
    },
  ]);

  const deliveryStats = await AutomationHistory.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: '$deliveryStatus',
        count: { $sum: 1 },
      },
    },
  ]);

  const totalAutomations = await AutomationHistory.countDocuments(baseQuery);

  return { statusStats, typeStats, deliveryStats, totalAutomations };
};

// Get member's pending approvals
const findPendingApprovalsByMemberId = async memberId => {
  console.log(memberId);
  return await AutomationHistory.find({
    memberId,
    status: 'pending_approval',
  })
    .populate('postId', 'content author')
    .populate('approvalRequiredBy', 'name email')
    .sort({ createdAt: -1 });
};

// Get member's scheduled automations
const findScheduledByMemberId = async (memberId, options = {}) => {
  const { upcoming = true, overdue = false } = options;
  const now = new Date();

  let query = {
    memberId,
    status: 'scheduled',
    scheduledFor: { $exists: true },
  };

  if (upcoming && !overdue) {
    query.scheduledFor = { $gte: now };
  } else if (overdue && !upcoming) {
    query.scheduledFor = { $lt: now };
  }

  return await AutomationHistory.find(query).populate('postId', 'content author').populate('scheduledBy', 'name email').sort({ scheduledFor: 1 });
};

// Get member's recurring automations
const findRecurringByMemberId = async memberId => {
  return await AutomationHistory.find({
    memberId,
    isRecurring: true,
    'recurringSchedule.nextScheduledDate': { $exists: true },
  })
    .populate('postId', 'content author')
    .sort({ 'recurringSchedule.nextScheduledDate': 1 });
};

// Get member's performance metrics
const getMemberPerformanceMetrics = async memberId => {
  return await AutomationHistory.aggregate([
    { $match: { memberId, status: 'sent' } },
    {
      $group: {
        _id: null,
        totalSent: { $sum: 1 },
        avgOpenRate: { $avg: '$openRate' },
        avgClickRate: { $avg: '$clickRate' },
        avgReplyRate: { $avg: '$replyRate' },
        totalReplies: { $sum: { $cond: ['$responseReceived', 1, 0] } },
      },
    },
  ]);
};

// Get distinct values for member's filters
const getDistinctValuesByMemberId = async (memberId, field) => {
  return await AutomationHistory.distinct(field, {
    memberId,
    [field]: { $ne: '' },
  });
};

// SECONDARY: Organization-wide functions (for admin/analytics only)
const findByOrganizationId = async (organizationId, options = {}) => {
  const {
    status,
    automationType,
    priority,
    deliveryStatus,
    sortBy = 'createdAt',
    order = 'desc',
    limit = 50,
    page = 1,
    search,
    specificMemberId, // Admin can filter by specific member
  } = options;

  let query = { organizationId };

  // If admin wants to see specific member's data
  if (specificMemberId) {
    query.memberId = specificMemberId;
  }

  // Apply other filters
  if (status && status !== 'all') {
    query.status = status;
  }

  if (automationType && automationType !== 'all') {
    query.automationType = automationType;
  }

  if (priority && priority !== 'all') {
    query.priority = priority;
  }

  if (deliveryStatus && deliveryStatus !== 'all') {
    query.deliveryStatus = deliveryStatus;
  }

  // Search functionality
  if (search) {
    query.$or = [
      { 'emailContent.to': { $regex: search, $options: 'i' } },
      { 'emailContent.subject': { $regex: search, $options: 'i' } },
      { templateName: { $regex: search, $options: 'i' } },
      { automationType: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  let sort = {};
  sort[sortBy] = order === 'desc' ? -1 : 1;

  return await AutomationHistory.find(query)
    .populate('memberId', 'name email profilePicture')
    .populate('postId', 'content author')
    .populate('templateId', 'name')
    .populate('approvedBy', 'name email')
    .populate('rejectedBy', 'name email')
    .populate('scheduledBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));
};

// Organization-wide statistics (for admin dashboard)
const getOrganizationStats = async (organizationId, filters = {}) => {
  const baseQuery = { organizationId, ...filters };

  // Get stats by member for organization
  const memberStats = await AutomationHistory.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: '$memberId',
        count: { $sum: 1 },
        pending_approval: { $sum: { $cond: [{ $eq: ['$status', 'pending_approval'] }, 1, 0] } },
        approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        scheduled: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // Get overall organization stats
  const overallStats = await AutomationHistory.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const totalAutomations = await AutomationHistory.countDocuments(baseQuery);

  return { memberStats, overallStats, totalAutomations };
};

// Find organization's pending approvals (for approval dashboard)
const findOrganizationPendingApprovals = async organizationId => {
  return await AutomationHistory.find({
    organizationId,
    status: 'pending_approval',
  })
    .populate('memberId', 'name email profilePicture')
    .populate('postId', 'content author')
    .populate('templateId', 'name')
    .populate('approvalRequiredBy', 'name email')
    .sort({ createdAt: -1 });
};

// LEGACY FUNCTIONS (kept for backward compatibility, but discouraged)
const findById = async id => {
  console.warn('findById without memberId is deprecated. Use findByIdAndMemberId for security.');
  return await AutomationHistory.findById(id)
    .populate('memberId', 'name email profilePicture')
    .populate('organizationId', 'name')
    .populate('postId', 'content author')
    .populate('templateId', 'name')
    .populate('approvedBy', 'name email')
    .populate('rejectedBy', 'name email')
    .populate('scheduledBy', 'name email');
};

module.exports = {
  // PRIMARY: Member-centric operations
  findByMemberId,
  countByMemberId,
  findByIdAndMemberId,
  create,
  updateByIdAndMemberId,
  deleteByIdAndMemberId,
  bulkUpdateByMemberId,
  bulkDeleteByMemberId,
  getMemberStats,
  findPendingApprovalsByMemberId,
  findScheduledByMemberId,
  findRecurringByMemberId,
  getMemberPerformanceMetrics,
  getDistinctValuesByMemberId,

  // SECONDARY: Organization-wide operations (admin only)
  findByOrganizationId,
  getOrganizationStats,
  findOrganizationPendingApprovals,

  // LEGACY: Discouraged functions
  findById,
};
