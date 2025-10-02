const linkedInRepository = require('../../repositories/linkedinRepository');
const organizationRepository = require('../../repositories/organizationRepository');
const memberRepository = require('../../repositories/memberRepository');
const linkedInHelper = require('./linkedinHelper');
const { sendPostStatusEmail } = require('../../admin/email/member');
const AppError = require('../../utils/appError');
const moment = require('moment');
const { logMemberActivity } = require('../Member/memberHelper');

const createScheduledPost = async (memberId, organizationId, postData, files) => {
  const { content, postDate, postTime, visibility, timeZone, status } = postData;
  console.log(postDate, postTime, visibility, timeZone, status);

  // Validate member credentials
  const member = await linkedInRepository.findMemberWithCredentials(memberId);
  console.log(member);
  const { accessToken, profileUrn } = linkedInHelper.validateMemberCredentials(member);
  console.log(accessToken, profileUrn);

  // Convert to UTC
  const utcDateTime = await linkedInHelper.convertToUTC(postDate, postTime, timeZone);
  console.log(utcDateTime);

  // Upload media to Firebase
  const media = await linkedInHelper.uploadMediaToFirebase(files);

  // Create scheduled post
  const scheduledPostData = {
    organizationId,
    memberId,
    content,
    status,
    postDate,
    postTime,
    visibility,
    timeZone,
    media,
    effectivePostTime: utcDateTime,
  };

  const scheduledPost = await linkedInRepository.createScheduledPost(scheduledPostData);
  console.log(scheduledPost);

  // Log member activity
  await logMemberActivity(memberId, 'linkedin_post_scheduled', {
    organizationId,
    postId: scheduledPost._id,
    postDate,
    postTime,
    status,
    visibility,
    hasMedia: media.length > 0,
    mediaCount: media.length,
    scheduledAt: new Date(),
    effectivePostTime: utcDateTime,
  });

  return scheduledPost;
};

const shareLinkedInPost = async (memberId, organizationId, postData, files) => {
  // Validate member credentials
  const member = await linkedInRepository.findMemberWithCredentials(memberId);
  const { accessToken, profileUrn } = linkedInHelper.validateMemberCredentials(member);

  // Get current time in member's timezone
  const now = moment().tz(member.timeZone);
  const postDate = now.format('DD-MM-YYYY');
  const postTime = now.format('HH:mm:ss');

  let media = [];
  let linkedInMedia = [];

  // Handle media upload if files exist
  if (files && files.length > 0) {
    // Upload to Firebase for storage
    media = await linkedInHelper.uploadMediaToFirebase(files);

    // Upload to LinkedIn for posting
    linkedInMedia = await linkedInHelper.uploadMediaToLinkedIn(media, accessToken, profileUrn);
  }

  // Create LinkedIn post body
  const linkedInPostBody = await linkedInHelper.createLinkedInPostBody(postData.content, postData.visibility, profileUrn, linkedInMedia);

  // Post to LinkedIn
  const response = await linkedInHelper.postToLinkedInAPI(linkedInPostBody, accessToken);

  // Save posted post to database
  const postedPostData = {
    organizationId,
    memberId,
    content: postData.content,
    status: 'Posted',
    postDate,
    postTime,
    visibility: postData.visibility,
    timeZone: member.timeZone,
    media,
    postId: response.id,
    effectivePostTime: new Date().toISOString(),
  };

  const postedPost = await linkedInRepository.createScheduledPost(postedPostData);
  // Log member activity
  await logMemberActivity(memberId, 'linkedin_post_shared', {
    organizationId,
    postId: postedPost._id,
    linkedinPostId: response.id,
    postDate,
    postTime,
    visibility: postData.visibility,
    hasMedia: media.length > 0,
    mediaCount: media.length,
    postedAt: new Date(),
  });

  sendPostStatusEmail(
    member.email,
    {
      _id: postedPost._id,
      content: postedPostData.content,
      postDate: postedPostData.postDate,
      postTime: postedPostData.postTime,
      postId: response.id,
    },
    'Posted'
  );

  return {
    postId: response.id,
    message: 'Post shared successfully on LinkedIn',
    savedPost: postedPost,
  };
};

const getScheduledPosts = async (memberId, organizationId, filters = {}) => {
  // Log member activity for viewing scheduled posts
  await logMemberActivity(memberId, 'linkedin_scheduled_posts_viewed', {
    organizationId,
    filters,
    viewedAt: new Date(),
  });

  return await linkedInRepository.findScheduledPosts(organizationId, memberId, filters);
};

const updateScheduledPost = async (postId, organizationId, updateData, files) => {
  const { content, postDate, postTime, visibility, timeZone, status, existingMediaUrls } = updateData;
  console.log(postDate, postTime, visibility, timeZone, status, existingMediaUrls);

  // Find existing post
  const scheduledPost = await linkedInRepository.findScheduledPostByIdAndOrg(postId, organizationId);
  if (!scheduledPost) {
    throw new AppError('Scheduled post not found', 404);
  }

  const previousStatus = scheduledPost.status;

  // Parse existing media and add new files
  let updatedMedia = [];
  if (existingMediaUrls) {
    updatedMedia = await linkedInHelper.parseExistingMedia(existingMediaUrls);
  }
  const newMedia = await linkedInHelper.uploadMediaToFirebase(files);
  if (updatedMedia.length > 0 && newMedia.length > 0) {
    updatedMedia = [...updatedMedia, ...newMedia];
  } else if (newMedia.length > 0) {
    updatedMedia = [...newMedia];
  }

  // Convert to UTC if date/time provided
  let utcDateTime = scheduledPost.effectivePostTime;
  if (postDate && postTime && timeZone) {
    console.log(postDate, postTime, timeZone);
    utcDateTime = await linkedInHelper.convertToUTC(postDate, postTime, timeZone);
  }

  // Prepare update data
  const updatePayload = {
    content: content || scheduledPost.content,
    postDate: postDate || scheduledPost.postDate,
    postTime: postTime || scheduledPost.postTime,
    visibility: visibility || scheduledPost.visibility,
    timeZone: timeZone || scheduledPost.timeZone,
    status: status || scheduledPost.status,
    media: updatedMedia,
    effectivePostTime: utcDateTime,
  };

  const updatedPost = await linkedInRepository.updateScheduledPost(postId, updatePayload);

  // Log member activity
  await logMemberActivity(scheduledPost.memberId, 'linkedin_post_updated', {
    organizationId,
    postId: postId,
    previousStatus,
    newStatus: updatePayload.status,
    contentChanged: content !== scheduledPost.content,
    scheduleChanged: postDate !== scheduledPost.postDate || postTime !== scheduledPost.postTime,
    visibilityChanged: visibility !== scheduledPost.visibility,
    mediaChanged: updatedMedia.length !== scheduledPost.media.length,
    updatedAt: new Date(),
  });

  return updatedPost;
};

const deleteScheduledPost = async (postId, organizationId) => {
  const scheduledPost = await linkedInRepository.findScheduledPostByIdAndOrg(postId, organizationId);
  if (!scheduledPost) {
    throw new AppError('Scheduled post not found', 404);
  }

  const deletedPost = await linkedInRepository.deleteScheduledPost(postId, organizationId);

  // Log member activity
  await logMemberActivity(scheduledPost.memberId, 'linkedin_post_deleted', {
    organizationId,
    postId: postId,
    deletedPostStatus: scheduledPost.status,
    postDate: scheduledPost.postDate,
    postTime: scheduledPost.postTime,
    hadMedia: scheduledPost.media.length > 0,
    deletedAt: new Date(),
  });

  return deletedPost;
};

const postToLinkedIn = async post => {
  try {
    // Get member credentials
    const member = await linkedInRepository.findMemberWithCredentials(post.memberId);
    if (!member || !member.linkedinAccessToken) {
      console.error(`LinkedIn not connected for member ${post.memberId}`);
      await updatePostStatusToFailed(post._id);
      return;
    }

    const { accessToken, profileUrn } = linkedInHelper.validateMemberCredentials(member);

    // Upload media to LinkedIn if exists
    const linkedInMedia = await linkedInHelper.uploadMediaToLinkedIn(post.media, accessToken, profileUrn);

    // Create LinkedIn post body
    const linkedInPostBody = await linkedInHelper.createLinkedInPostBody(post.content, post.visibility, profileUrn, linkedInMedia);

    // Post to LinkedIn
    const response = await linkedInHelper.postToLinkedInAPI(linkedInPostBody, accessToken);

    // Update post status to Posted
    await linkedInRepository.updatePostStatus(post._id, 'Posted', {
      postId: response.id,
    });

    // Log successful posting activity
    await logMemberActivity(post.memberId, 'linkedin_scheduled_post_published', {
      organizationId: post.organizationId,
      postId: post._id,
      linkedinPostId: response.id,
      publishedAt: new Date(),
      scheduledFor: post.effectivePostTime,
      hasMedia: post.media.length > 0,
      mediaCount: post.media.length,
      visibility: post.visibility,
    });

    // Send success email
    await sendPostStatusEmail(
      member.email,
      {
        _id: post._id,
        content: post.content,
        postDate: post.postDate,
        postTime: post.postTime,
        postId: response.id,
      },
      'Posted'
    );
    console.log(`✅ Successfully posted scheduled post ${post._id}`);
    return {
      success: true,
      postId: post._id,
      linkedinPostId: response.id,
    };
  } catch (error) {
    console.error(`❌ Error posting scheduled post ${post._id}:`, error.message);
    await handlePostingError(post, error);
  }
};

const handlePostingError = async (post, error) => {
  await updatePostStatusToFailed(post._id);

  // Log failed posting activity
  await logMemberActivity(post.memberId, 'linkedin_scheduled_post_failed', {
    organizationId: post.organizationId,
    postId: post._id,
    scheduledFor: post.effectivePostTime,
    failedAt: new Date(),
    error: error.message,
    visibility: post.visibility,
    hasMedia: post.media.length > 0,
  });

  const member = await linkedInRepository.findMemberWithCredentials(post.memberId);
  if (member?.email) {
    await sendPostStatusEmail(
      member.email,
      {
        _id: post._id,
        content: post.content,
        postDate: post.postDate,
        postTime: post.postTime,
      },
      'Failed',
      error.message
    );
  }
};

const updatePostStatusToFailed = async postId => {
  return await linkedInRepository.updatePostStatus(postId, 'Failed');
};

const schedulePosts = async () => {
  console.log('🔄 Checking for scheduled posts to publish...');

  try {
    const now = moment().utc().format();
    console.log('Current UTC Time:', now);

    const postsToPublish = await linkedInRepository.findPostsToPublish(now);

    if (postsToPublish.length === 0) {
      console.log('✅ No scheduled posts to publish at this time.');
      return {
        success: true,
        message: 'No scheduled posts to publish at this time',
        postsProcessed: 0,
        results: [],
      };
    }

    console.log(`🚀 Found ${postsToPublish.length} posts to publish.`);

    for (const post of postsToPublish) {
      const orgId = post.organizationId;

      // Check if we already validated this organization
      if (!organizationLimits.has(orgId)) {
        const organization = await organizationRepository.findById(orgId);

        if (!organization) {
          console.warn(`⚠️ Organization ${orgId} not found for post ${post._id}`);
          limitExceededPosts.push({
            post,
            error: 'Organization not found',
          });
          continue;
        }
      }
      {
        postsToProcess.push(post);
      }
    }

    // Handle posts that exceeded limits
    for (const { post, error } of limitExceededPosts) {
      await handlePostingError(post, new Error(error));
    }

    if (postsToProcess.length === 0) {
      console.log('⚠️ No posts to process after limit checking.');
      return {
        success: true,
        message: 'All posts exceeded organization limits',
        postsProcessed: postsToPublish.length,
        successCount: 0,
        failureCount: limitExceededPosts.length,
        results: limitExceededPosts.map(({ post, error }) => ({
          postId: post._id,
          status: 'failed',
          message: error,
        })),
      };
    }

    console.log(`✅ ${postsToProcess.length} posts passed limit check, ${limitExceededPosts.length} posts exceeded limits`);

    // Log bulk processing activity (system level)
    const memberIds = [...new Set(postsToProcess.map(post => post.memberId))];
    for (const memberId of memberIds) {
      const memberPosts = postsToProcess.filter(post => post.memberId === memberId);
      await logMemberActivity(memberId, 'linkedin_bulk_processing_started', {
        organizationId: memberPosts[0].organizationId,
        postsCount: memberPosts.length,
        processedAt: new Date(),
      });
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const post of postsToProcess) {
      try {
        await postToLinkedIn(post);
        results.push({
          postId: post._id,
          status: 'success',
          message: 'Post published successfully',
        });
        successCount++;
      } catch (error) {
        await handlePostingError(post, error);
        results.push({
          postId: post._id,
          status: 'failed',
          message: error.message,
        });
        failureCount++;
      }

      // Add small delay between posts
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const summary = {
      success: true,
      message: `Processed ${postsToPublish.length} scheduled posts`,
      postsProcessed: postsToPublish.length,
      successCount,
      failureCount,
      results,
    };

    console.log(`✅ Processing complete: ${successCount} successful, ${failureCount} failed`);
    return summary;
  } catch (error) {
    console.error('❌ Error in scheduled posts processing:', error.message);

    return {
      success: false,
      message: 'Error in scheduled posts processing',
      error: error.message,
      postsProcessed: 0,
      results: [],
    };
  }
};

const getPostsStatistics = async (organizationId, memberId) => {
  // Log statistics viewing activity
  if (memberId) {
    await logMemberActivity(memberId, 'linkedin_statistics_viewed', {
      organizationId,
      viewedAt: new Date(),
    });
  }

  return await linkedInRepository.getPostsStatistics(organizationId);
};

const disconnectLinkedIn = async (memberId, organizationId) => {
  // Verify member exists and belongs to organization
  const member = await memberRepository.findByIdAndOrg(memberId, organizationId);
  if (!member) {
    throw new AppError('Member not found or does not belong to the organization', 404);
  }

  // Check if member is connected to LinkedIn
  if (member.isLinkedinConnected === false) {
    throw new AppError('Member is not connected to LinkedIn', 400);
  }

  // Disconnect LinkedIn
  const updatedMember = await memberRepository.updateById(memberId, {
    isLinkedinConnected: false,
    linkedinAccessToken: null,
    tokenExpiresIn: null,
    linkedinProfileId: null,
  });

  // Log activity
  await logMemberActivity(memberId, 'linkedin_disconnected', {
    organizationId,
    disconnectedAt: new Date(),
  });

  return updatedMember;
};

module.exports = {
  disconnectLinkedIn,
  shareLinkedInPost,
  schedulePosts,
  deleteScheduledPost,
  updateScheduledPost,
  getScheduledPosts,
  createScheduledPost,
  getPostsStatistics,
};
