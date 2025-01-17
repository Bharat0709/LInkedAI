const multer = require('multer');
const Member = require('../models/members');
const AppError = require('../utils/appError');
const axios = require('axios');
const { decryptToken } = require('../utils/linkedInAuth');
const catchAsync = require('../utils/catchAsync');
const dotenv = require('dotenv');
dotenv.config();

const upload = multer().any();
exports.parseFormData = upload;

exports.shareLinkedInPost = catchAsync(async (req, res, next) => {
  const memberId = req.params.id;

  // Retrieve member details
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

      return {
        status: 'READY',
        description: { text: '' },
        media: assetUrn, // Use LinkedIn asset URN
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

      res.status(200).json({
        status: 'success',
        data: {
          postId: response.data.id,
          message: 'Post shared successfully on LinkedIn',
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

      res.status(200).json({
        status: 'success',
        data: {
          postId: response.data.id,
          message: 'Post shared successfully on LinkedIn',
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
