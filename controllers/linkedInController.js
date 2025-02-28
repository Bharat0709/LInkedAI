const multer = require('multer');
const Member = require('../models/members');
const AppError = require('../utils/appError');
const axios = require('axios');
const { decryptToken } = require('../utils/linkedInAuth');
const catchAsync = require('../utils/catchAsync');
const dotenv = require('dotenv');
const { bucket } = require('../utils/firebaseConfig');
const moment = require('moment-timezone');
const ScheduledPost = require('../models/scheduledPost');
const mailController = require('./mailController');

const upload = multer().any();
dotenv.config();

exports.parseFormData = upload;

const uploadMediaToFirebase = async (file) => {
  return new Promise((resolve, reject) => {
    const fileName = `postMedia/${Date.now()}-${file.originalname}`;
    const fileRef = bucket.file(fileName);
    const stream = fileRef.createWriteStream({
      metadata: { contentType: file.mimetype },
    });

    stream.on('error', (err) => reject(err));
    stream.on('finish', async () => {
      try {
        await fileRef.makePublic();
        resolve(`https://storage.googleapis.com/${bucket.name}/${fileName}`);
      } catch (err) {
        reject(err);
      }
    });

    stream.end(file.buffer);
  });
};

const fetchMediaFromFirebase = async (fileUrl) => {
  try {
    const response = await fetch(fileUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch media: ${response.statusText}`);
    }

    // Read content properly
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type');

    // Convert to Blob
    const buffer = new Blob([arrayBuffer], { type: contentType });

    return { buffer, contentType };
  } catch (error) {
    console.error('Error fetching media:', error);
    throw error;
  }
};

exports.shareLinkedInPost = catchAsync(async (req, res, next) => {
  const memberId = req.params.id;
  const organizationId = req.organization.id;

  if (!organizationId) {
    return next(new AppError('organizationId is required', 400));
  }

  const member = await Member.findById(memberId).select(
    '+linkedinAccessToken +linkedinProfileId'
  );

  if (!member) {
    return next(new AppError('Member not found', 404));
  }

  if (!member.linkedinAccessToken) {
    return next(new AppError('LinkedIn is not connected for this member', 400));
  }

  // Decrypt access token and profile URN
  const accessToken = decryptToken(member.linkedinAccessToken);
  const profileUrn = decryptToken(member.linkedinProfileId);

  let media = [];
  const now = moment().tz(member.timeZone);

  // Format date as DD-MM-YYYY
  const postDate = now.format('DD-MM-YYYY');

  // Format time as HH:mm:ss (24-hour format)
  const postTime = now.format('HH:mm:ss');

  if (req.files && req.files.length > 0) {
    const mediaPromises = req.files.map(async (file) => {
      const isImage = file.mimetype.startsWith('image/');
      const isPDF = file.mimetype === 'application/pdf';

      if (!isImage && !isPDF) {
        throw new AppError(
          `Unsupported media type: ${file.mimetype}. Only images and PDFs are allowed.`,
          400
        );
      }

      const recipe = isImage
        ? 'urn:li:digitalmediaRecipe:feedshare-image'
        : 'urn:li:digitalmediaRecipe:feedshare-document';

      // Step 1: Register upload request with LinkedIn
      const assetUploadResponse = await axios.post(
        process.env.LINKEDIN_REGISTER_UPLOAD,
        {
          registerUploadRequest: {
            owner: `urn:li:person:${profileUrn}`,
            recipes: [recipe],
            serviceRelationships: [
              {
                identifier: 'urn:li:userGeneratedContent',
                relationshipType: 'OWNER',
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const uploadUrl =
        assetUploadResponse.data.value.uploadMechanism[
          'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
        ].uploadUrl;

      const assetUrn = assetUploadResponse.data.value.asset;

      // Step 2: Upload the file to LinkedIn's URL
      await axios.put(uploadUrl, file.buffer, {
        headers: {
          'Content-Type': file.mimetype,
        },
      });

      const firebaseUrl = await uploadMediaToFirebase(file);
      media.push({
        type: isImage ? 'image' : 'pdf',
        url: firebaseUrl,
        title: file.originalname,
        description: '',
      });

      return {
        status: 'READY',
        description: { text: '' },
        media: assetUrn,
        title: { text: file.originalname },
      };
    });

    const preparedMedia = await Promise.all(mediaPromises);
    // Determine media category based on file type
    const mediaCategory = req.files.some(
      (file) => file.mimetype === 'application/pdf'
    )
      ? 'DOCUMENT'
      : 'IMAGE';

    // Prepare the post body with media
    const linkedInPostBody = {
      author: `urn:li:person:${profileUrn}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: req.body.content },
          shareMediaCategory: mediaCategory,
          media: preparedMedia,
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility':
          req.body.visibility.toUpperCase(),
      },
    };

    try {
      const response = await axios.post(
        process.env.LINKEDIN_POST_URL,
        linkedInPostBody,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const postedPost = await ScheduledPost.create({
        organizationId,
        memberId,
        content: req.body.content,
        status: 'Posted',
        postDate,
        postTime,
        visibility: req.body.visibility,
        timeZone: member.timeZone,
        media,
        postId: response?.data?.id,
        effectivePostTime: new Date().toISOString(),
      });

      res.status(200).json({
        status: 'success',
        data: {
          postId: response.data.id,
          message: 'Post shared successfully on LinkedIn',
          savedPost: postedPost,
        },
      });
    } catch (err) {
      console.error(
        'Error posting to LinkedIn:',
        err.response?.data || err.message
      );
      return next(new AppError('Error posting to LinkedIn', 500));
    }
  } else {
    // If no media is provided, create a post without media
    const linkedInPostBody = {
      author: `urn:li:person:${profileUrn}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: req.body.content },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility':
          req.body.visibility.toUpperCase(),
      },
    };

    try {
      const response = await axios.post(
        process.env.LINKEDIN_POST_URL,
        linkedInPostBody,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const postedPost = await ScheduledPost.create({
        organizationId,
        memberId,
        content: req.body.content,
        status: 'Posted',
        postDate,
        postTime,
        postId: response.data.id,
        visibility: req.body.visibility,
        timeZone: member.timeZone,
        media,
        effectivePostTime: new Date().toISOString(),
      });
      res.status(200).json({
        status: 'success',
        data: {
          postId: response.data.id,
          message: 'Post shared successfully on LinkedIn',
          savedPost: postedPost,
        },
      });
    } catch (err) {
      console.error(
        'Error posting to LinkedIn:',
        err.response?.data || err.message
      );
      return next(new AppError('Error posting to LinkedIn', 500));
    }
  }
});

exports.createScheduledPost = catchAsync(async (req, res, next) => {
  const memberId = req.params.id;
  const { content, postDate, postTime, visibility, timeZone, status } =
    req.body;

  const organizationId = req.organization.id;

  if (!organizationId) {
    return next(new AppError('organizationId is required', 400));
  }
  // Validate member
  const member = await Member.findById(memberId).select(
    '+linkedinAccessToken +linkedinProfileId'
  );
  if (!member) return next(new AppError('Member not found', 404));
  if (!member.linkedinAccessToken)
    return next(new AppError('LinkedIn is not connected for this member', 400));
  const localDateTime = `${postDate} ${postTime}`;
  const utcDateTime = moment
    .tz(localDateTime, 'DD-MM-YYYY HH:mm:ss', timeZone)
    .utc()
    .format();

  // Upload media to Firebase and store the URLs
  let media = [];
  if (req.files && req.files.length > 0) {
    media = await Promise.all(
      req.files.map(async (file) => {
        const url = await uploadMediaToFirebase(file);
        return {
          type: file.mimetype.startsWith('image/') ? 'image' : 'pdf',
          url,
          title: file.originalname,
          description: '',
        };
      })
    );
  }

  // Create scheduled post in DB
  const scheduledPost = await ScheduledPost.create({
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
  });

  res.status(201).json({
    status: 'success',
    data: { scheduledPost },
  });
});

exports.getScheduledPosts = catchAsync(async (req, res, next) => {
  const { id: memberId } = req.params;
  const organizationId = req.organization.id;

  if (!organizationId) {
    return next(new AppError('organizationId is required', 400));
  }

  // Fetch scheduled posts for the given member and organization
  const scheduledPosts = await ScheduledPost.find({ organizationId, memberId });

  res.status(200).json({
    status: 'success',
    data: { scheduledPosts },
  });
});

exports.updateScheduledPost = catchAsync(async (req, res, next) => {
  const { id: postId } = req.params;
  const {
    content,
    postDate,
    postTime,
    visibility,
    timeZone,
    status,
    existingMediaUrls,
  } = req.body;
  const organizationId = req.organization.id;
  if (!organizationId) {
    return next(new AppError('organizationId is required', 400));
  }

  // Find the post
  const scheduledPost = await ScheduledPost.findOne({
    _id: postId,
    organizationId,
  });
  if (!scheduledPost) {
    return next(new AppError('Scheduled post not found', 404));
  }

  // Parse existing media URLs (handle different formats)
  let updatedMedia = [];

  if (existingMediaUrls) {
    try {
      let parsedMedia = existingMediaUrls;

      // Ensure parsing only if it's a string
      if (typeof existingMediaUrls === 'string') {
        parsedMedia = JSON.parse(existingMediaUrls);
      }

      // Ensure parsedMedia is an array
      if (Array.isArray(parsedMedia)) {
        updatedMedia = parsedMedia.map((media) => ({
          url: media.url,
          type: media.type || 'unknown',
          title: media.title || '',
          description: media.description || '',
        }));
      } else {
        console.error('Parsed media is not an array:', parsedMedia);
        return next(new AppError('Invalid existing media format', 400));
      }
    } catch (error) {
      console.error('Error parsing existing media URLs:', error);
      return next(new AppError('Invalid existing media format', 400));
    }
  }

  if (req.files && req.files.length > 0) {
    const newMedia = await Promise.all(
      req.files.map(async (file) => {
        const url = await uploadMediaToFirebase(file);
        return {
          type: file.mimetype.startsWith('image/') ? 'image' : 'pdf',
          url,
          title: file.originalname,
          description: '',
        };
      })
    );
    updatedMedia = [...updatedMedia, ...newMedia];
  }

  // Update the post
  scheduledPost.content = content || scheduledPost.content;
  scheduledPost.postDate = postDate || scheduledPost.postDate;
  scheduledPost.postTime = postTime || scheduledPost.postTime;
  scheduledPost.visibility = visibility || scheduledPost.visibility;
  scheduledPost.timeZone = timeZone || scheduledPost.timeZone;
  scheduledPost.status = status || scheduledPost.status;
  scheduledPost.media = updatedMedia;

  await scheduledPost.save();

  res.status(200).json({
    status: 'success',
    data: { scheduledPost },
  });
});

exports.deleteScheduledPost = catchAsync(async (req, res, next) => {
  const { id: postId } = req.params;
  const organizationId = req.organization.id;

  if (!organizationId) {
    return next(new AppError('organizationId is required', 400));
  }

  const scheduledPost = await ScheduledPost.findOneAndDelete({
    _id: postId,
    organizationId,
  });

  if (!scheduledPost) {
    return next(new AppError('Scheduled post not found', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Scheduled post deleted successfully',
  });
});

const postToLinkedIn = async (post) => {
  try {
    const member = await Member.findById(post.memberId).select(
      '+linkedinAccessToken +linkedinProfileId'
    );
    if (!member || !member.linkedinAccessToken) {
      console.error(`LinkedIn not connected for member ${post.memberId}`);
      await ScheduledPost.findByIdAndUpdate(post._id, { status: 'Failed' });
      return;
    }

    const accessToken = decryptToken(member.linkedinAccessToken);
    const profileUrn = decryptToken(member.linkedinProfileId);

    let media = [];
    if (post.media && post.media.length > 0) {
      const mediaPromises = post.media.map(async (file) => {
        const { buffer, contentType } = await fetchMediaFromFirebase(file.url);
        const isPDF = contentType === 'application/pdf';
        const recipe = isPDF
          ? 'urn:li:digitalmediaRecipe:feedshare-document'
          : 'urn:li:digitalmediaRecipe:feedshare-image';

        const assetUploadResponse = await axios.post(
          process.env.LINKEDIN_REGISTER_UPLOAD,
          {
            registerUploadRequest: {
              owner: `urn:li:person:${profileUrn}`,
              recipes: [recipe],
              serviceRelationships: [
                {
                  identifier: 'urn:li:userGeneratedContent',
                  relationshipType: 'OWNER',
                },
              ],
            },
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const uploadUrl =
          assetUploadResponse.data.value.uploadMechanism[
            'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
          ].uploadUrl;
        const assetUrn = assetUploadResponse.data.value.asset;

        await axios.put(uploadUrl, buffer, {
          headers: { 'Content-Type': contentType },
        });

        return {
          status: 'READY',
          description: { text: '' },
          media: assetUrn,
          title: { text: file.title },
        };
      });

      media = await Promise.all(mediaPromises);
    }

    const mediaCategory = post.media.some((file) => file.type === 'pdf')
      ? 'DOCUMENT'
      : 'IMAGE';

    const linkedInPostBody = {
      author: `urn:li:person:${profileUrn}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: post.content },
          shareMediaCategory: media.length > 0 ? mediaCategory : 'NONE',
          media,
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility':
          post.visibility.toUpperCase(),
      },
    };

    const response = await axios.post(
      process.env.LINKEDIN_POST_URL,
      linkedInPostBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    await ScheduledPost.findByIdAndUpdate(post._id, {
      status: 'Posted',
      postId: response.data?.id,
    });
    console.log(`✅ Post ${post._id} successfully shared on LinkedIn`);

    await mailController.sendPostStatusEmail(
      member.email,
      {
        _id: post._id,
        content: post.content,
        postDate: post.postDate,
        postTime: post.postTime,
        postId: response.data?.id,
      },
      'Posted'
    );
  } catch (err) {
    console.error(
      `❌ Error posting scheduled post ${post._id}:`,
      err.response?.data || err.message
    );

    // Update the status to 'Failed' to prevent retrying and duplicate failure emails
    await ScheduledPost.findByIdAndUpdate(post._id, { status: 'Failed' });

    const member = await Member.findById(post.memberId).select('+email');
    if (member) {
      await mailController.sendPostStatusEmail(
        member.email,
        {
          _id: post._id,
          content: post.content,
          postDate: post.postDate,
          postTime: post.postTime,
        },
        'Failed',
        err.response?.data?.message || err.message
      );
    }
  }
};

exports.schedulePosts = async () => {
  console.log('🔄 Checking for scheduled posts to publish...');

  try {
    const now = moment().utc().format();
    console.log('Current UTC Time', now);
    const postsToPublish = await ScheduledPost.find({
      status: 'Scheduled',
      effectivePostTime: { $lte: now },
    });

    if (postsToPublish.length === 0) {
      console.log('✅ No scheduled posts to publish at this time.');
      return;
    }

    console.log(`🚀 Found ${postsToPublish.length} posts to publish.`);
    for (const post of postsToPublish) {
      await postToLinkedIn(post);
    }
  } catch (error) {
    console.error('❌ Error fetching scheduled posts:', error.message);
  }
};
