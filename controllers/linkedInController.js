const multer = require('multer');
const Member = require('../models/members');
const AppError = require('../utils/appError');
const axios = require('axios');
const { decryptToken } = require('../utils/linkedInAuth');
const catchAsync = require('../utils/catchAsync');

const upload = multer().none();
exports.parseFormData = upload;

exports.shareLinkedInPost = catchAsync(async (req, res, next) => {
  const memberId = req.params.id;

  let mediaArray = [];
  if (req.body.media) {
    try {
      if (Array.isArray(req.body.media)) {
        mediaArray = req.body.media.map((item) =>
          typeof item === 'string' ? JSON.parse(item) : item
        );
      } else {
        mediaArray = [JSON.parse(req.body.media)];
      }
    } catch (err) {
      return next(
        new AppError('Invalid media format. Ensure it is valid JSON.', 400)
      );
    }
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

  // Decrypt the tokens
  const accessToken = decryptToken(member.linkedinAccessToken);
  const profileUrn = decryptToken(member.linkedinProfileId);

  // Prepare the LinkedIn post content
  const linkedInPostBody = {
    author: `urn:li:person:${profileUrn}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: req.body.content,
        },
        shareMediaCategory: mediaArray.length > 0 ? 'IMAGE' : 'NONE',
        media: mediaArray.map((media) => ({
          status: 'READY',
          description: {
            text: media.description,
          },
          media: media.url,
          title: {
            text: media.title,
          },
        })),
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility':
        req.body.visibility.toUpperCase(),
    },
  };

  // Make LinkedIn API request
  const response = await axios.post(
    process.env.LINKEDIN_API_URL || 'https://api.linkedin.com/v2/ugcPosts',
    linkedInPostBody,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }
  );

  // Success response
  res.status(200).json({
    status: 'success',
    data: {
      postId: response.data.id,
      message: 'Post shared successfully on LinkedIn',
    },
  });
});
