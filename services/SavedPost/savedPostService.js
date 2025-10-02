const savedPostRepository = require('../../repositories/savedPostRepository');
const Member = require('../../models/members');
const Organization = require('../../models/organization');
const AppError = require('../../utils/appError');

const createSavedPost = async (postData, user) => {
  const organizationId = user.organizationId;

  if (!organizationId || !user) {
    throw new AppError('Unauthorized to perform this action', 401);
  }

  if (!postData.content) {
    throw new AppError('Post content is required', 400);
  }

  // Check for duplicate post
  const existingPosts = await savedPostRepository.findByOrganizationId(organizationId, {
    search: postData.content,
    memberId: user._id,
  });

  const duplicate = existingPosts.find(post => post.content === postData.content && post.author === postData.author);

  if (duplicate) {
    throw new AppError('This post has already been saved', 400);
  }

  const savedPostData = {
    ...postData,
    savedBy: user._id,
    organizationId,
    emailAddresses: postData.emailAddresses || [],
    formLinks: postData.formLinks || [],
    phoneNumbers: postData.phoneNumbers || [],
    websiteUrls: postData.websiteUrls || [],
    likes: postData.likes || 0,
    comments: postData.comments || 0,
    shares: postData.shares || 0,
    views: postData.views || 0,
  };

  return await savedPostRepository.create(savedPostData);
};

const getSavedPosts = async (organizationId, options) => {
  const organization = await Organization.findById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found', 404);
  }

  // Verify member if memberId is provided
  if (options.memberId) {
    const memberExists = await Member.findOne({
      _id: options.memberId,
      organizationId,
    });

    if (!memberExists) {
      throw new AppError('Member not found in your organization', 404);
    }
  }

  const posts = await savedPostRepository.findByOrganizationId(organizationId, options);
  const totalPosts = await savedPostRepository.countByOrganizationId(organizationId, {
    leadStatus: options.status !== 'all' ? options.status : undefined,
    category: options.category,
    savedBy: options.memberId,
  });

  // Get filter options
  const categories = await savedPostRepository.getDistinctValues(organizationId, 'category');
  const tags = await savedPostRepository.getDistinctValues(organizationId, 'tags');
  const { stats } = await savedPostRepository.getStats(organizationId);

  const formattedStatusCounts = {
    all: totalPosts,
    new: 0,
    contacted: 0,
    responded: 0,
    qualified: 0,
    converted: 0,
    closed: 0,
    rejected: 0,
  };

  stats.forEach(stat => {
    if (formattedStatusCounts[stat._id] !== undefined) {
      formattedStatusCounts[stat._id] = stat.count;
    }
  });

  return {
    posts,
    totalPosts,
    totalPages: Math.ceil(totalPosts / parseInt(options.limit || 50)),
    currentPage: parseInt(options.page || 1),
    filters: {
      categories,
      tags,
      statusCounts: formattedStatusCounts,
    },
  };
};

const getSavedPostStats = async (organizationId, timeframe, memberId) => {
  const organization = await Organization.findById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found', 404);
  }

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

  let filters = dateFilter;
  if (memberId) {
    const memberExists = await Member.findOne({
      _id: memberId,
      organizationId,
    });

    if (!memberExists) {
      throw new AppError('Member not found in your organization', 404);
    }

    filters.savedBy = memberId;
  }

  const { stats, totalPosts } = await savedPostRepository.getStats(organizationId, filters);

  const formattedStats = {
    new: 0,
    contacted: 0,
    responded: 0,
    qualified: 0,
    converted: 0,
    closed: 0,
    rejected: 0,
  };

  stats.forEach(stat => {
    if (formattedStats[stat._id] !== undefined) {
      formattedStats[stat._id] = stat.count;
    }
  });

  return {
    statusCounts: formattedStats,
    totalPosts,
  };
};

const getSavedPost = async postId => {
  const post = await savedPostRepository.findById(postId);

  if (!post) {
    throw new AppError('Saved post not found', 404);
  }
  return post;
};

const updateSavedPost = async (postId, updateData, user) => {
  const post = await savedPostRepository.findById(postId);

  if (!post) {
    throw new AppError('Saved post not found', 404);
  }

  // Check permissions
  const canUpdate = post.organizationId.toString() === user._id.toString();

  if (!canUpdate) {
    throw new AppError('You do not have permission to update this post', 403);
  }

  return await savedPostRepository.updateById(postId, updateData);
};

const updateGeneratedEmail = async (postId, updateData) => {
  const post = await savedPostRepository.findById(postId);

  if (!post) {
    throw new AppError('Saved post not found', 404);
  }

  return await savedPostRepository.updateById(postId, updateData);
};

const updateStatus = async (postId, status, user) => {
  const validStatuses = ['new', 'contacted', 'responded', 'qualified', 'converted', 'closed', 'rejected'];

  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid status value', 400);
  }

  const updateData = {
    leadStatus: status,
    ...(status === 'contacted' && { lastContactedAt: new Date() }),
  };

  return await updateSavedPost(postId, updateData, user);
};

const bulkUpdatePosts = async (postIds, updateData, user) => {
  if (!Array.isArray(postIds) || postIds.length === 0) {
    throw new AppError('Post IDs are required', 400);
  }

  // Verify ownership of all posts
  const posts = await Promise.all(postIds.map(id => savedPostRepository.findById(id)));

  const hasPermission = posts.every(post => post && (post.savedBy._id.toString() === user._id.toString() || (post.organizationId.toString() === user.organizationId.toString() && ['admin', 'owner'].includes(user.role))));

  if (!hasPermission) {
    throw new AppError('You do not have permission to update some of these posts', 403);
  }

  await savedPostRepository.bulkUpdate(postIds, updateData);

  return { message: `${postIds.length} posts updated successfully` };
};

const deleteSavedPost = async (postId, user) => {
  console.log(postId);
  const post = await savedPostRepository.findById(postId);
  if (!post) {
    throw new AppError('Saved post not found', 404);
  }
  console.log(post?.organizationId, user._id);
  // Check permissions (typically only organization admins can delete)
  const canDelete = post?.organizationId.toString() === user._id.toString();

  if (!canDelete) {
    throw new AppError('You do not have permission to delete this post', 403);
  }

  await savedPostRepository.deleteById(postId);
};

const getMembersWithSavedPosts = async (organizationId, timeframe) => {
  const memberStats = await savedPostRepository.getMemberStats(organizationId, timeframe);

  // Get all members for the organization
  const allMembers = await Member.find({ organizationId }, { _id: 1, name: 1, profilePicture: 1, email: 1 });

  // Combine member info with post counts
  const memberData = allMembers.map(member => {
    const stats = memberStats.find(stat => stat._id && stat._id.toString() === member._id.toString());

    return {
      memberId: member._id,
      name: member.name,
      email: member.email,
      profilePicture: member.profilePicture,
      totalPosts: stats ? stats.count : 0,
      statusCounts: stats
        ? {
            new: stats.new || 0,
            contacted: stats.contacted || 0,
            responded: stats.responded || 0,
            qualified: stats.qualified || 0,
            converted: stats.converted || 0,
            closed: stats.closed || 0,
            rejected: stats.rejected || 0,
          }
        : {
            new: 0,
            contacted: 0,
            responded: 0,
            qualified: 0,
            converted: 0,
            closed: 0,
            rejected: 0,
          },
    };
  });

  // Sort by total posts
  memberData.sort((a, b) => b.totalPosts - a.totalPosts);

  return memberData;
};

const getDuePosts = async organizationId => {
  return await savedPostRepository.findDuePosts(organizationId);
};

const getExpiringPosts = async (organizationId, days = 7) => {
  return await savedPostRepository.findExpiring(organizationId, days);
};

const generateEmailContent = async (postId, templateType = 'default') => {
  const post = await savedPostRepository.findById(postId);

  if (!post) {
    throw new AppError('Saved post not found', 404);
  }

  // This is a placeholder for AI-generated content
  // You can integrate with your AI service here
  const generatedContent = {
    subject: `Opportunity Discussion - ${post.authorCompany || 'Your Company'}`,
    body: `Hi ${post.author},\n\nI came across your recent post and found it very interesting...\n\nBest regards`,
  };

  // Update the post with generated content
  await savedPostRepository.updateById(postId, {
    generatedEmailBody: generatedContent.body,
    generatedSubject: generatedContent.subject,
  });

  return generatedContent;
};

// BULK UPDATE STATUS
const bulkUpdateStatus = async (postIds, status, user) => {
  if (!Array.isArray(postIds) || postIds.length === 0) {
    throw new AppError('Post IDs are required', 400);
  }

  // Verify ownership of all posts
  const posts = await Promise.all(postIds.map(id => savedPostRepository.findById(id)));

  const hasPermission = posts.every(post => post && post.organizationId.toString() === user._id.toString());

  if (!hasPermission) {
    throw new AppError('You do not have permission to update some of these posts', 403);
  }

  const updateData = {
    leadStatus: status,
    ...(status === 'contacted' && { lastContactedAt: new Date() }),
  };

  await savedPostRepository.bulkUpdate(postIds, updateData);

  return { message: `${postIds.length} posts status updated successfully` };
};

// BULK UPDATE PRIORITY
const bulkUpdatePriority = async (postIds, priority, user) => {
  if (!Array.isArray(postIds) || postIds.length === 0) {
    throw new AppError('Post IDs are required', 400);
  }

  // Verify ownership of all posts
  const posts = await Promise.all(postIds.map(id => savedPostRepository.findById(id)));

  const hasPermission = posts.every(post => post && post.organizationId.toString() === user._id.toString());

  if (!hasPermission) {
    throw new AppError('You do not have permission to update some of these posts', 403);
  }

  const updateData = { leadPriority: priority };

  await savedPostRepository.bulkUpdate(postIds, updateData);

  return { message: `${postIds.length} posts priority updated successfully` };
};

const bulkUpdateAutomation = async (postIds, automationData, user) => {
  if (!Array.isArray(postIds) || postIds.length === 0) {
    throw new AppError('Post IDs are required', 400);
  }

  // Verify ownership of all posts
  const posts = await Promise.all(postIds.map(id => savedPostRepository.findById(id)));

  const hasPermission = posts.every(post => post && post.organizationId.toString() === user._id.toString());

  if (!hasPermission) {
    throw new AppError('You do not have permission to update some of these posts', 403);
  }

  // Prepare update data with only valid automation fields
  const updateData = {};

  if (automationData.automationEnabled !== undefined) {
    updateData.automationEnabled = automationData.automationEnabled;
  }

  if (automationData.personalizationLevel !== undefined) {
    updateData.personalizationLevel = automationData.personalizationLevel;
  }

  if (automationData.followUpInterval !== undefined) {
    updateData.followUpInterval = parseInt(automationData.followUpInterval);
  }

  if (automationData.maxFollowUps !== undefined) {
    updateData.maxFollowUps = parseInt(automationData.maxFollowUps);
  }

  if (automationData.followUpCount !== undefined) {
    updateData.followUpCount = parseInt(automationData.followUpCount);
  }

  if (automationData.autoFollowUp !== undefined) {
    updateData.autoFollowUp = Boolean(automationData.autoFollowUp);
  }

  if (automationData.generateEmail !== undefined) {
    updateData.generateEmail = Boolean(automationData.generateEmail);
  }

  if (automationData.generateLinkedInMessage !== undefined) {
    updateData.generateLinkedInMessage = Boolean(automationData.generateLinkedInMessage);
  }

  if (automationData.followUpDate) {
    updateData.followUpDate = new Date(automationData.followUpDate);
  }

  if (automationData.nextAutomationDate) {
    updateData.nextAutomationDate = new Date(automationData.nextAutomationDate);
  }

  await savedPostRepository.bulkUpdate(postIds, updateData);

  return { message: `${postIds.length} posts automation settings updated successfully` };
};

// BULK DELETE POSTS
const bulkDeletePosts = async (postIds, user) => {
  if (!Array.isArray(postIds) || postIds.length === 0) {
    throw new AppError('Post IDs are required', 400);
  }

  // Verify ownership of all posts
  const posts = await Promise.all(postIds.map(id => savedPostRepository.findById(id)));

  const hasPermission = posts.every(post => post && post.organizationId.toString() === user._id.toString());

  if (!hasPermission) {
    throw new AppError('You do not have permission to delete some of these posts', 403);
  }

  await savedPostRepository.bulkDelete(postIds);

  return { message: `${postIds.length} posts deleted successfully` };
};

module.exports = {
  // Create
  createSavedPost,
  generateEmailContent,
  // Delete
  deleteSavedPost,
  // Update
  bulkUpdatePosts,
  bulkUpdateStatus,
  bulkUpdatePriority,
  bulkUpdateAutomation,
  bulkDeletePosts,
  updateStatus,
  updateSavedPost,
  updateGeneratedEmail,
  // Get
  getSavedPost,
  getSavedPostStats,
  getSavedPosts,
  getExpiringPosts,
  getDuePosts,
  getMembersWithSavedPosts,
};
