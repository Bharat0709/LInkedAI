// services/contentCalendarService.js
const contentCalendarRepository = require('../../repositories/contentCalendarRepository');
const memberRepository = require('../../repositories/memberRepository');
const AppError = require('../../utils/appError');
const calendarHelper = require('./contentCalendarHelper');
const { logMemberActivity } = require('../Member/memberHelper');
const { incrementContentCalendarCount, decrementContentCalendarCount } = require('../../middlewares/calendarUseage');

const addContentCalendar = async (memberId, organizationId, calendarData) => {
  if (!Array.isArray(calendarData) || calendarData.length === 0) {
    throw new AppError('Calendar data must be an array and cannot be empty.', 400);
  }

  // Verify member exists and belongs to organization
  const member = await memberRepository.findByIdAndOrg(memberId, organizationId);
  if (!member) {
    throw new AppError('Member not found or does not belong to the organization.', 404);
  }

  // Validate each calendar entry
  const validatedEntries = [];
  for (let data of calendarData) {
    const { title, date, time } = data;

    if (!title || !date || !time) {
      throw new AppError('Title, Date, and Time are required fields for each calendar entry.', 400);
    }

    // Parse date in DD-MM-YYYY format
    const entryDate = calendarHelper.parseDate(date);

    if (!entryDate || isNaN(entryDate.getTime())) {
      throw new AppError(`Invalid date format for entry: ${title}. Please use DD-MM-YYYY format.`, 400);
    }

    // Convert and validate time
    const convertedTime = calendarHelper.convertTo24Hour(time);

    if (!convertedTime) {
      throw new AppError(`Invalid time format for entry: ${title}. Use HH:MM (24-hour) or HH:MM AM/PM format.`, 400);
    }

    // Check if the date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    entryDate.setHours(0, 0, 0, 0);

    if (entryDate < today) {
      throw new AppError(`Date cannot be in the past for entry: ${title}`, 400);
    }

    validatedEntries.push({
      topic: title.trim(),
      date: data.date,
      time: convertedTime,
      memberId,
      organizationId,
      status: 'Planned',
    });
  }

  // Create calendar entries
  const createdEntries = await contentCalendarRepository.createMultiple(validatedEntries);

  await incrementContentCalendarCount(organizationId, createdEntries.length);

  // Log activity
  await logMemberActivity(memberId, 'content_calendar_added', {
    organizationId,
    entriesCount: createdEntries.length,
    entries: createdEntries.map(entry => ({
      topic: entry.topic,
      date: entry.date, // Format as YYYY-MM-DD for logging
      time: entry.time,
    })),
  });

  return createdEntries;
};

const getContentCalendar = async (memberId, organizationId, filters = {}) => {
  // Verify member exists and belongs to organization
  const member = await memberRepository.findByIdAndOrg(memberId, organizationId);
  if (!member) {
    throw new AppError('Member not found or does not belong to the organization.', 404);
  }

  // Build query filters
  const queryFilters = { memberId, organizationId };

  if (filters.status) {
    queryFilters.status = filters.status;
  }

  if (filters.startDate || filters.endDate) {
    queryFilters.date = {};
    if (filters.startDate) {
      queryFilters.date.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      queryFilters.date.$lte = new Date(filters.endDate);
    }
  }

  const contentCalendar = await contentCalendarRepository.findByFilters(queryFilters);
  return contentCalendar || [];
};

const updateContentCalendar = async (memberId, organizationId, contentId, updatedData) => {
  const { topic, date, time, status } = updatedData;

  // Validate required fields
  if (!topic || !date || !time || !status) {
    throw new AppError('Missing required fields: topic, date, time, and status are required.', 400);
  }

  // Validate status
  const validStatuses = ['Planned', 'Scheduled', 'Posted'];
  if (!validStatuses.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
  }

  // Parse date in DD-MM-YYYY format
  const entryDate = calendarHelper.parseDate(date);

  if (isNaN(entryDate.getTime())) {
    throw new AppError('Invalid date format', 400);
  }

  // Validate time format
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    throw new AppError('Invalid time format. Use HH:MM format.', 400);
  }

  // Verify member exists and belongs to organization
  const member = await memberRepository.findByIdAndOrg(memberId, organizationId);
  if (!member) {
    throw new AppError('Member not found or does not belong to the organization.', 404);
  }

  // Find and update calendar entry
  const existingEntry = await contentCalendarRepository.findByIdAndMember(contentId, memberId, organizationId);
  if (!existingEntry) {
    throw new AppError('Content Calendar entry not found.', 404);
  }

  const updatePayload = {
    topic: topic.trim(),
    date: entryDate,
    time: time.trim(),
    status,
    updatedAt: new Date(),
  };

  const updatedEntry = await contentCalendarRepository.updateById(contentId, updatePayload);

  // Log activity
  await logMemberActivity(memberId, 'content_calendar_updated', {
    organizationId,
    contentId,
    previousStatus: existingEntry.status,
    newStatus: status,
    topic: topic.trim(),
  });

  return updatedEntry;
};

const deleteContentCalendar = async (memberId, organizationId, contentId) => {
  // Verify member exists and belongs to organization
  const member = await memberRepository.findByIdAndOrg(memberId, organizationId);
  if (!member) {
    throw new AppError('Member not found or does not belong to the organization.', 404);
  }

  // Find calendar entry
  const existingEntry = await contentCalendarRepository.findByIdAndMember(contentId, memberId, organizationId);
  if (!existingEntry) {
    throw new AppError('Content Calendar entry not found.', 404);
  }

  // Delete the entry
  await contentCalendarRepository.deleteById(contentId, memberId, organizationId);

  await decrementContentCalendarCount(organizationId, 1);

  // Log activity
  await logMemberActivity(memberId, 'content_calendar_deleted', {
    organizationId,
    contentId,
    topic: existingEntry.topic,
    date: existingEntry.date,
  });

  return true;
};

const getContentCalendarStats = async (memberId, organizationId) => {
  // Verify member exists and belongs to organization
  const member = await memberRepository.findByIdAndOrg(memberId, organizationId);
  if (!member) {
    throw new AppError('Member not found or does not belong to the organization.', 404);
  }

  const stats = await contentCalendarRepository.getStatsByMember(memberId, organizationId);

  return {
    total: stats.total || 0,
    planned: stats.planned || 0,
    inProgress: stats.inProgress || 0,
    completed: stats.completed || 0,
    cancelled: stats.cancelled || 0,
  };
};

module.exports = {
  addContentCalendar,
  getContentCalendar,
  updateContentCalendar,
  deleteContentCalendar,
  getContentCalendarStats,
};
