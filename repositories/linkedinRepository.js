const ScheduledPost = require('../models/scheduledPost');
const Member = require('../models/members');
const { findByFilters } = require('./contentCalendarRepository');

const createScheduledPost = async postData => {
  const scheduledPost = new ScheduledPost(postData);
  return await scheduledPost.save();
};

const findScheduledPosts = async (organizationId, memberId, filters = {}) => {
  const query = { organizationId, memberId, ...filters };
  return await ScheduledPost.find(query).sort({ createdAt: -1 });
};

const findScheduledPostByIdAndOrg = async (postId, organizationId) => {
  return await ScheduledPost.findOne({ _id: postId, organizationId });
};

const updateScheduledPost = async (postId, updateData) => {
  return await ScheduledPost.findByIdAndUpdate(postId, updateData, {
    new: true,
    runValidators: true,
  });
};

const deleteScheduledPost = async (postId, organizationId) => {
  return await ScheduledPost.findOneAndDelete({
    _id: postId,
    organizationId,
  });
};

const findPostsToPublish = async currentTime => {
  return await ScheduledPost.find({
    status: 'Scheduled',
    effectivePostTime: { $lte: currentTime },
  });
};

const updatePostStatus = async (postId, status, additionalData = {}) => {
  const updateData = { status, ...additionalData };
  return await ScheduledPost.findByIdAndUpdate(postId, updateData, { new: true });
};

const findMemberWithCredentials = async memberId => {
  return await Member.findById(memberId).select('+linkedinAccessToken +linkedinProfileId +email');
};

const countPostsByOrgAndStatus = async (organizationId, status) => {
  return await ScheduledPost.countDocuments({ organizationId, status });
};

const countAllPostsByOrg = async organizationId => {
  return await ScheduledPost.countDocuments({ organizationId });
};

const getPostsStatistics = async organizationId => {
  const stats = await ScheduledPost.aggregate([
    { $match: { organizationId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id.toLowerCase()] = stat.count;
    return acc;
  }, {});
};

module.exports = {
  createScheduledPost,
  findMemberWithCredentials,
  findByFilters,
  findPostsToPublish,
  findScheduledPostByIdAndOrg,
  findScheduledPostByIdAndOrg,
  findScheduledPostByIdAndOrg,
  updateScheduledPost,
  deleteScheduledPost,
  updatePostStatus,
  countAllPostsByOrg,
  countPostsByOrgAndStatus,
  getPostsStatistics,
  findScheduledPosts,
};
