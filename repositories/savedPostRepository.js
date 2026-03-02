const SavedPost = require('../models/savedPost');

const findById = async id => {
  return await SavedPost.findById(id).populate('savedBy', 'name profilePicture email');
};

const buildQuery = (organizationId, options) => {
  const { status, category, priority, search, memberId, tags } = options;
  let query = { organizationId };

  if (status && status !== 'all') {
    query.leadStatus = status;
  }
  if (category) {
    query.category = category;
  }
  if (priority) {
    query.leadPriority = priority;
  }
  if (memberId) {
    query.savedBy = memberId;
  }
  if (tags && tags.length > 0) {
    query.tags = { $in: tags };
  }
  if (search) {
    query.$or = [
      { content: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
      { authorCompany: { $regex: search, $options: 'i' } },
      { emailAddresses: { $regex: search, $options: 'i' } },
    ];
  }
  return query;
};

const findByOrganizationId = async (organizationId, options = {}) => {
  const { sortBy = 'createdAt', order = 'desc', limit = 50, page = 1 } = options;
  const query = buildQuery(organizationId, options);
  const skip = (parseInt(page) - 1) * parseInt(limit);
  let sort = {};
  sort[sortBy] = order === 'desc' ? -1 : 1;

  return await SavedPost.find(query).populate('savedBy', 'name profilePicture').sort(sort).skip(skip).limit(parseInt(limit));
};

const countByOrganizationId = async (organizationId, options = {}) => {
  const query = buildQuery(organizationId, options);
  return await SavedPost.countDocuments(query);
};

const findByMemberId = async (memberId, options = {}) => {
  const query = { savedBy: memberId, ...options };
  return await SavedPost.find(query).sort({ createdAt: -1 });
};

const create = async savedPostData => {
  const savedPost = new SavedPost(savedPostData);
  return await savedPost.save();
};

const updateById = async (id, updateData) => {
  return await SavedPost.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

const deleteById = async id => {
  return await SavedPost.findByIdAndDelete(id);
};

const bulkUpdate = async (ids, updateData) => {
  return await SavedPost.updateMany({ _id: { $in: ids } }, { $set: { ...updateData, updatedAt: Date.now() } });
};

const getStats = async (organizationId, filters = {}) => {
  const baseQuery = { organizationId, ...filters };

  const stats = await SavedPost.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: '$leadStatus',
        count: { $sum: 1 },
      },
    },
  ]);

  const totalPosts = await SavedPost.countDocuments(baseQuery);

  return { stats, totalPosts };
};

const getDistinctValues = async (organizationId, field) => {
  return await SavedPost.distinct(field, {
    organizationId,
    [field]: { $ne: '' },
  });
};

const findDuePosts = async organizationId => {
  const today = new Date();
  return await SavedPost.find({
    organizationId,
    followUpDate: { $lte: today },
    leadStatus: { $nin: ['converted', 'closed', 'rejected'] },
  }).populate('savedBy', 'name email');
};

const getMemberStats = async (organizationId, timeframe = 'all') => {
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

  const baseQuery = { organizationId, ...dateFilter };

  return await SavedPost.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: '$savedBy',
        count: { $sum: 1 },
        new: { $sum: { $cond: [{ $eq: ['$leadStatus', 'new'] }, 1, 0] } },
        contacted: { $sum: { $cond: [{ $eq: ['$leadStatus', 'contacted'] }, 1, 0] } },
        responded: { $sum: { $cond: [{ $eq: ['$leadStatus', 'responded'] }, 1, 0] } },
        qualified: { $sum: { $cond: [{ $eq: ['$leadStatus', 'qualified'] }, 1, 0] } },
        converted: { $sum: { $cond: [{ $eq: ['$leadStatus', 'converted'] }, 1, 0] } },
        closed: { $sum: { $cond: [{ $eq: ['$leadStatus', 'closed'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$leadStatus', 'rejected'] }, 1, 0] } },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

const findExpiring = async (organizationId, days = 7) => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return await SavedPost.find({
    organizationId,
    followUpDate: { $lte: futureDate, $gte: new Date() },
    leadStatus: { $nin: ['converted', 'closed', 'rejected'] },
  }).populate('savedBy', 'name email');
};

const bulkDelete = async ids => {
  return await SavedPost.deleteMany({ _id: { $in: ids } });
};

module.exports = {
  findById,
  findByOrganizationId,
  countByOrganizationId,
  findByMemberId,
  create,
  updateById,
  deleteById,
  bulkUpdate,
  bulkDelete,
  getStats,
  getDistinctValues,
  findDuePosts,
  getMemberStats,
  findExpiring,
};
