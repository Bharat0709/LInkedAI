const axios = require('axios');
const moment = require('moment-timezone');
const { bucket } = require('../../config/firebaseConfig');
const { decryptToken } = require('../../utils/linkedInAuth');
const AppError = require('../../utils/appError');

const convertToUTC = async (postDate, postTime, timeZone) => {
  const localDateTime = `${postDate} ${postTime}`;
  return moment.tz(localDateTime, 'DD-MM-YYYY HH:mm:ss', timeZone).utc().format();
};

const uploadMediaToFirebase = async files => {
  if (!files || files.length === 0) {
    return [];
  }

  return await Promise.all(
    files.map(async file => {
      const url = await uploadSingleFileToFirebase(file);
      return {
        type: file.mimetype.startsWith('image/') ? 'image' : 'pdf',
        url,
        title: file.originalname,
        description: '',
      };
    })
  );
};

const uploadSingleFileToFirebase = async file => {
  try {
    const fileName = `scheduled-posts/${Date.now()}_${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', async () => {
        await fileUpload.makePublic();
        resolve(`https://storage.googleapis.com/${bucket.name}/${fileName}`);
      });
      stream.end(file.buffer);
    });
  } catch (error) {
    console.error('Firebase upload error:', error);
    throw new AppError('Failed to upload media to Firebase', 500);
  }
};

const fetchMediaFromFirebase = async url => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return {
      buffer: Buffer.from(response.data),
      contentType: response.headers['content-type'] || 'application/octet-stream',
    };
  } catch (error) {
    console.error('Error fetching media from Firebase:', error);
    throw new AppError('Failed to fetch media from Firebase', 500);
  }
};

const parseExistingMedia = async existingMediaUrls => {
  if (!existingMediaUrls) {
    return [];
  }

  try {
    let parsedMedia = existingMediaUrls;

    // Parse if it's a string
    if (typeof existingMediaUrls === 'string') {
      parsedMedia = JSON.parse(existingMediaUrls);
    }

    // Ensure it's an array
    if (!Array.isArray(parsedMedia)) {
      console.error('Parsed media is not an array:', parsedMedia);
      throw new AppError('Invalid existing media format', 400);
    }

    return parsedMedia.map(media => ({
      url: media.url,
      type: media.type || 'unknown',
      title: media.title || '',
      description: media.description || '',
    }));
  } catch (error) {
    console.error('Error parsing existing media URLs:', error);
    throw new AppError('Invalid existing media format', 400);
  }
};

const uploadMediaToLinkedIn = async (mediaFiles, accessToken, profileUrn) => {
  if (!mediaFiles || mediaFiles.length === 0) {
    return [];
  }

  const mediaPromises = mediaFiles.map(async file => {
    const { buffer, contentType } = await fetchMediaFromFirebase(file.url);
    const isPDF = contentType === 'application/pdf';
    const recipe = isPDF ? 'urn:li:digitalmediaRecipe:feedshare-document' : 'urn:li:digitalmediaRecipe:feedshare-image';

    // Register upload
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

    const uploadUrl = assetUploadResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
    const assetUrn = assetUploadResponse.data.value.asset;

    // Upload media
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

  return await Promise.all(mediaPromises);
};

const createLinkedInPostBody = async (content, visibility, profileUrn, media = []) => {
  const mediaCategory = media.some(file => file.title?.text?.toLowerCase().includes('pdf') || file.media?.includes('document')) ? 'DOCUMENT' : media.length > 0 ? 'IMAGE' : 'NONE';
  console.log(visibility, profileUrn, content, media);
  return {
    author: `urn:li:person:${profileUrn}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: content },
        shareMediaCategory: mediaCategory,
        media,
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': visibility.toUpperCase(),
    },
  };
};

const postToLinkedInAPI = async (postBody, accessToken) => {
  console.log(postBody);
  try {
    const response = await axios.post(process.env.LINKEDIN_POST_URL, postBody, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(response);
    return response.data;
  } catch (error) {
    console.error('LinkedIn API Error:', error.response?.data || error.message);
    throw new AppError(`LinkedIn posting failed: ${error.response?.data?.message || error.message}`, 500);
  }
};

const validateMemberCredentials = member => {
  if (!member) {
    throw new AppError('Member not found', 404);
  }
  if (!member.linkedinAccessToken) {
    throw new AppError('LinkedIn is not connected for this member', 400);
  }
  return {
    accessToken: decryptToken(member.linkedinAccessToken),
    profileUrn: decryptToken(member.linkedinProfileId),
  };
};

module.exports = {
  convertToUTC,
  validateMemberCredentials,
  postToLinkedInAPI,
  createLinkedInPostBody,
  uploadMediaToFirebase,
  uploadMediaToLinkedIn,
  parseExistingMedia,
  fetchMediaFromFirebase,
  uploadSingleFileToFirebase,
};
