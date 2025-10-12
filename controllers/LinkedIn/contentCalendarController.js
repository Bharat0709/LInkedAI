const dotenv = require('dotenv');
dotenv.config();
const catchAsync = require('../../utils/catchAsync');
const contentCalendarService = require('../../services/ContentCalendar/contentCalendarService');

exports.addContentCalendar = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId;
  const organizationId = req.organization.id;
  const { calendarData } = req.body;

  const createdEntries = await contentCalendarService.addContentCalendar(memberId, organizationId, calendarData);


  res.status(201).json({
    status: 'success',
    message: 'Content calendar entries have been successfully added.',
    data: {
      contentCalendar: createdEntries,
    },
    usage: req.usageUpdated,
  });
});

exports.getContentCalendar = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId;
  const organizationId = req.organization.id;
  const { status, startDate, endDate } = req.query

  const filters = {};
  if (status) filters.status = status;
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;

  const contentCalendar = await contentCalendarService.getContentCalendar(memberId, organizationId, filters);

  res.status(200).json({
    status: 'success',
    message: 'Content calendar entries fetched successfully.',
    results: contentCalendar.length,
    data: {
      contentCalendar,
    },
  });
});

exports.updateContentCalendar = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId;
  const organizationId = req.organization.id;
  const contentId = req.params.contentId;
  const updatedData = req.body;

  const updatedEntry = await contentCalendarService.updateContentCalendar(memberId, organizationId, contentId, updatedData);

  res.status(200).json({
    status: 'success',
    message: 'Content Calendar entry updated successfully.',
    data: {
      contentCalendar: updatedEntry,
    },
  });
});

exports.deleteContentCalendar = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId;
  const organizationId = req.organization.id;
  const contentId = req.params.contentId;

  await contentCalendarService.deleteContentCalendar(memberId, organizationId, contentId);

  res.status(204).json({
    status: 'success',
    message: 'Content Calendar entry deleted successfully.',
  });
});

exports.getContentCalendarStats = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId;
  const organizationId = req.organization.id;

  const stats = await contentCalendarService.getContentCalendarStats(memberId, organizationId);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

module.exports = exports;
