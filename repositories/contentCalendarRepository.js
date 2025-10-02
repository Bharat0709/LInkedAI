// repositories/contentCalendarRepository.js
const ContentCalendar = require('../models/contentCalender');

const findById = async id => {
  return await ContentCalendar.findById(id);
};

const findByIdAndMember = async (id, memberId, organizationId) => {
  return await ContentCalendar.findOne({
    _id: id,
    memberId,
    organizationId,
  });
};

const findByFilters = async (filters, sortOptions = { date: 1, time: 1 }) => {
  return await ContentCalendar.find(filters).sort(sortOptions);
};

const findByMemberAndOrg = async (memberId, organizationId, sortOptions = { date: 1, time: 1 }) => {
  return await ContentCalendar.find({
    memberId,
    organizationId,
  }).sort(sortOptions);
};

const create = async calendarData => {
  const calendar = new ContentCalendar({
    ...calendarData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return await calendar.save();
};

const createMultiple = async calendarDataArray => {
  const calendarsToInsert = calendarDataArray.map(data => ({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  return await ContentCalendar.insertMany(calendarsToInsert);
};

const updateById = async (id, updateData) => {
  return await ContentCalendar.findByIdAndUpdate(id, { ...updateData, updatedAt: new Date() }, { new: true, runValidators: true });
};

const deleteById = async (id, memberId, organizationId) => {
  return await ContentCalendar.findOneAndDelete({
    _id: id,
    memberId,
    organizationId,
  });
};

const softDeleteById = async (id, memberId, organizationId) => {
  return await ContentCalendar.findOneAndUpdate(
    {
      _id: id,
      memberId,
      organizationId,
    },
    {
      deletedAt: new Date(),
      updatedAt: new Date(),
    },
    { new: true }
  );
};

const getStatsByMember = async (memberId, organizationId) => {
  const pipeline = [
    {
      $match: {
        memberId: memberId,
        organizationId: organizationId,
        deletedAt: { $exists: false },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        planned: {
          $sum: {
            $cond: [{ $eq: ['$status', 'Planned'] }, 1, 0],
          },
        },
        inProgress: {
          $sum: {
            $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0],
          },
        },
        completed: {
          $sum: {
            $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0],
          },
        },
        cancelled: {
          $sum: {
            $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0],
          },
        },
      },
    },
  ];

  const result = await ContentCalendar.aggregate(pipeline);
  return result[0] || {};
};

const findUpcoming = async (memberId, organizationId, days = 7) => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + days);

  return await ContentCalendar.find({
    memberId,
    organizationId,
    date: { $gte: startDate, $lte: endDate },
    status: { $in: ['Planned', 'In Progress'] },
    deletedAt: { $exists: false },
  }).sort({ date: 1, time: 1 });
};

const findOverdue = async (memberId, organizationId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return await ContentCalendar.find({
    memberId,
    organizationId,
    date: { $lt: today },
    status: { $in: ['Planned', 'In Progress'] },
    deletedAt: { $exists: false },
  }).sort({ date: -1 });
};

const countByMemberAndDateRange = async (memberId, organizationId, startDate, endDate) => {
  return await ContentCalendar.countDocuments({
    memberId,
    organizationId,
    date: { $gte: startDate, $lte: endDate },
    deletedAt: { $exists: false },
  });
};

const bulkUpdateStatus = async (ids, memberId, organizationId, newStatus) => {
  return await ContentCalendar.updateMany(
    {
      _id: { $in: ids },
      memberId,
      organizationId,
    },
    {
      status: newStatus,
      updatedAt: new Date(),
    }
  );
};

module.exports = {
  findById,
  findByIdAndMember,
  findByFilters,
  findByMemberAndOrg,
  create,
  createMultiple,
  updateById,
  deleteById,
  softDeleteById,
  getStatsByMember,
  findUpcoming,
  findOverdue,
  countByMemberAndDateRange,
  bulkUpdateStatus,
};
