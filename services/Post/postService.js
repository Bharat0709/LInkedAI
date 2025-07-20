// services/post/postService.js
const postRepository = require('../../repositories/postRepository');
const AppError = require('../../utils/appError');
const postHelper = require('./postHelper');

const upsertPostsData = async (memberId, organizationId, posts) => {
  if (!Array.isArray(posts) || posts.length === 0) {
    throw new AppError('Posts data must be a non-empty array', 400);
  }

  if (!memberId) {
    throw new AppError('MemberId not found', 404);
  }

  const member = await postHelper.validateMemberAndOrganization(memberId, organizationId);
  // Filter posts by member name
  const memberName = member?.name;

  const filteredPosts = posts.filter(post => post.author === memberName);

  if (filteredPosts.length === 0) {
    throw new AppError('No posts match the member name', 400);
  }

  const processedPosts = [];

  for (const post of filteredPosts) {
    postHelper.validatePostData(post);

    const processedPostData = postHelper.processPostData(post, member);

    let existingPost = await postRepository.findByPostUrn(post.postUrn, organizationId, memberId);

    if (existingPost) {
      existingPost = await postRepository.updatePost(post.postUrn, organizationId, processedPostData);
    } else {
      existingPost = await postRepository.createPost({
        organizationId,
        memberId,
        ...processedPostData,
      });
    }

    processedPosts.push(existingPost);
  }

  return {
    status: 'success',
    postsProcessed: processedPosts.length,
  };
};

const getPostsByMemberAndOrganization = async (memberId, organizationId) => {
  await postHelper.validateMemberAndOrganization(memberId, organizationId);

  const posts = await postRepository.findByMemberAndOrganization(organizationId, memberId);

  if (!posts || posts.length === 0) {
    return {
      message: 'No posts found for this member and organization',
      posts: [],
      topPosts: [],
      stats: {
        totalImpressions: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalViews: 0,
      },
    };
  }

  const stats = postRepository.calculateStats(posts);
  const topPosts = postRepository.getTopPosts(posts, 5);

  return {
    message: 'Success',
    posts,
    topPosts,
    stats,
  };
};

module.exports = {
  upsertPostsData,
  getPostsByMemberAndOrganization,
};
