const Post = require('../models/posts');

const findByPostUrn = async (postUrn, organizationId, memberId) => {
  return await Post.findOne({
    postUrn,
    organizationId,
    memberId,
  });
};

const createPost = async postData => {
  return await Post.create(postData);
};

const updatePost = async (postUrn, organizationId, updateData) => {
  return await Post.findOneAndUpdate({ postUrn, organizationId }, updateData, { new: true, runValidators: true });
};

const findByMemberAndOrganization = async (organizationId, memberId) => {
  return await Post.find({
    organizationId,
    memberId,
  });
};

/**
 * Fetches top posts specifically optimized for MCP Persona analysis.
 * Sorts by a combination of likes and comments to find "high-value" content.
 */
const getHighEngagementPosts = async (organizationId, memberId, limit = 20) => {
  return await Post.find({ organizationId, memberId }).sort({ numLikes: -1, numComments: -1 }).limit(limit).lean();
};

/**
 * Fetches the most recent posts to capture the current "vibe" or trending topics the user is on.
 */
const getRecentPosts = async (organizationId, memberId, limit = 10) => {
  return await Post.find({ organizationId, memberId })
    .sort({ _id: -1 }) // Assuming ObjectId timestamp or add a createdAt field
    .limit(limit)
    .lean();
};

const calculateStats = posts => {
  if (!posts || posts.length === 0) {
    return {
      totalImpressions: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalViews: 0,
    };
  }

  return {
    totalImpressions: posts.reduce((sum, post) => sum + (post.numImpressions || 0), 0),
    totalLikes: posts.reduce((sum, post) => sum + (post.numLikes || 0), 0),
    totalComments: posts.reduce((sum, post) => sum + (post.numComments || 0), 0),
    totalShares: posts.reduce((sum, post) => sum + (post.numShares || 0), 0),
    totalViews: posts.reduce((sum, post) => sum + (post.numViews || 0), 0),
  };
};

const getTopPosts = (posts, limit = 5) => {
  if (!posts || posts.length === 0) return [];

  return posts.sort((a, b) => (b.numImpressions || 0) - (a.numImpressions || 0)).slice(0, limit);
};

module.exports = {
  findByPostUrn,
  createPost,
  updatePost,
  findByMemberAndOrganization,
  getHighEngagementPosts,
  getRecentPosts,
  calculateStats,
  getTopPosts,
};
