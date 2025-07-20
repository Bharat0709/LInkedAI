// repositories/postRepository.js
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
  calculateStats,
  getTopPosts,
};
