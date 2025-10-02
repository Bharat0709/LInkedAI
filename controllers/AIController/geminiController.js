// controllers/geminiController.js
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const aiHelper = require('../../services/AI/aiHelper');
const geminiService = require('../../services/AI/geminiService');

const CREDITS_CONFIG = {
  COMMENT_GENERATION: 5,
  POST_GENERATION: 10,
  TEMPLATE_GENERATION: 10,
};

exports.generateCommentGemini = catchAsync(async (req, res, next) => {
  const { postContent, selectedOption } = req.body;
  const user = req.member;
  if (!postContent || !selectedOption) {
    return next(new AppError('Post content and selected option are required', 400));
  }

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Verify and deduct credits
  const updatedUser = await aiHelper.processCredits('member', user._id, CREDITS_CONFIG.COMMENT_GENERATION);

  console.log('UPDATED USER', updatedUser);

  // Generate comment
  const generatedComment = await geminiService.generateComment(postContent, selectedOption);

  console.log('COMMENT', generatedComment);

  res.status(200).json({
    status: 'success',
    generatedComment,
    remainingCredits: updatedUser.creditsLeft,
  });
});

exports.generateCustomCommentGemini = catchAsync(async (req, res, next) => {
  const { postContent, customTone, wordCount } = req.body;

  if (!postContent || !customTone || !wordCount) {
    return next(new AppError('Post content, custom tone, and word count are required', 400));
  }

  const user = req.member;
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Verify and deduct credits
  const updatedUser = await aiHelper.processCredits('member', user._id, CREDITS_CONFIG.COMMENT_GENERATION);

  // Generate custom comment
  const generatedComment = await geminiService.generateCustomComment(postContent, customTone, wordCount);

  res.status(200).json({
    status: 'success',
    generatedComment,
    remainingCredits: updatedUser.creditsLeft,
  });
});

async function getCustomComment(postContent, customTone, wordCount) {
  const parts = [
    {
      text: `As a linkedIn user in India on behalf of me help me write a ${customTone} comment for a linkedIn Post with the following post content:\n\n${postContent} in ${wordCount} words
      Requirements:
      - The tone of the comment should strictly be in ${customTone} tone
      - The comment should be relevant to the whole post content
      - STRICTLY IN A SINGLE PARA AND DONT'T INCLUDE LINES LIKE HERE'S IS YOUR COMMENT ETC, JUST GIVE THE COMMENT AS A RESULT IN A SINGLE PARA
      - Give response as if a real user have written the comment
      - You can use emojis as well if its a congratulatory comment
      - Do not repeat the words wriiten in the post. Give a comment as if a linkedIn user is replying for the given post.
      - Do not include double quotes in response
      - Do not include hashtags response 
      - Give enagaging comment & complete the comment within the word limit 
      - The comment should not seem to be written by AI`,
    },
    { text: '\n' },
  ];
  const generationConfig = {
    temperature: 0.45,
    topK: 32,
    topP: 0.65,
    maxOutputTokens: 120,
  };
  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
    generationConfig,
    safetySettings,
  });

  return result.response.text();
}

async function getComment(postContent, selectedOption) {
  const parts = [
    {
      text: `As a linkedIn user in India on behalf of me help me write a ${selectedOption} tone.  comment for a linkedIn Post with the following post content:\n\n${postContent} 
      Requirements:
      - The comment should be strictly in ${selectedOption} tone only.
      - The comment should be relevant to the whole post content
      - Give response as if a real user have written the comment
      - Do not repeat the words wriiten in the post. Give a comment as if a linkedIn user is replying for the given post.
      - You can use emojis as well if its a congratulatory comment
      - Give result in a single paragraph and not greater than 30 words, STRICTLY IN A SINGLE PARA AND DONT'T INCLUDE LINES LIKE HERE'S IS YOUR COMMENT ETC, JUST GIVE THE COMMENT AS A RESULT IN A SINGLE PARA
      - Do not include double quotes in response
      - Do not include hashtags in response 
      - Give a short and engaging comment 
      - Comment should not seem to be written by AI`,
    },
    { text: '\n' },
  ];
  const generationConfig = {
    temperature: 0.45,
    topK: 32,
    topP: 0.65,
    maxOutputTokens: 120,
  };
  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
    generationConfig,
    safetySettings,
  });

  return result.response.text();
}

exports.generatePostContentGemini = catchAsync(async (req, res, next) => {
  const { postType, selectedTone } = req.body;

  if (!postType || !selectedTone) {
    return next(new AppError('Post type and selected tone are required', 400));
  }

  const user = req.member;
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Verify and deduct credits
  const updatedUser = await aiHelper.processCredits('member', user._id, CREDITS_CONFIG.POST_GENERATION);

  // Generate post content
  const generatedPostContent = await geminiService.generatePostContent(postType, selectedTone);

  res.status(200).json({
    status: 'success',
    data: {
      generatedPostContent,
      remainingCredits: updatedUser.creditsLeft,
    },
  });
});

exports.generateOrganizationPostContentUsePersona = catchAsync(async (req, res, next) => {
  const { postType, language, persona, selectedTone } = req.body;

  if (!postType || !language || !selectedTone) {
    return next(new AppError('Post type, language, and selected tone are required', 400));
  }

  const organization = req.organization;
  if (!organization) {
    return next(new AppError('Organization not found', 404));
  }

  // Verify and deduct credits
  const updatedOrganization = await aiHelper.processCredits('organization', organization._id, CREDITS_CONFIG.POST_GENERATION);

  // Generate post content with persona
  const generatedPostContent = await geminiService.generateOrganizationPostContentWithPersona(postType, selectedTone, language, persona);

  res.status(200).json({
    status: 'success',
    data: {
      generatedPostContent,
      remainingCredits: updatedOrganization.credits,
    },
  });
});

exports.generateOrganizationPostContentUseTemplate = catchAsync(async (req, res, next) => {
  const { postType, language, template, selectedTone } = req.body;

  if (!postType || !language || !selectedTone) {
    return next(new AppError('Post type, language, and selected tone are required', 400));
  }

  const organization = req.organization;
  if (!organization) {
    return next(new AppError('Organization not found', 404));
  }

  // Verify and deduct credits
  const updatedOrganization = await aiHelper.processCredits('organization', organization._id, CREDITS_CONFIG.POST_GENERATION);

  // Generate post content with template
  const generatedPostContent = await geminiService.generateOrganizationPostContentWithTemplate(postType, selectedTone, language, template);

  res.status(200).json({
    status: 'success',
    data: {
      generatedPostContent,
      remainingCredits: updatedOrganization.credits,
    },
  });
});

exports.generateTemplateGemini = catchAsync(async (req, res, next) => {
  const { templateRequirements, selectedTone } = req.body;

  if (!templateRequirements || !selectedTone) {
    return next(new AppError('Template requirements and selected tone are required', 400));
  }

  const user = req.member;
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Verify and deduct credits
  const updatedUser = await aiHelper.processCredits('member', user._id, CREDITS_CONFIG.TEMPLATE_GENERATION);

  // Generate template
  const generatedTemplateContent = await geminiService.generateTemplate(templateRequirements, selectedTone);

  res.status(200).json({
    status: 'success',
    data: {
      generatedTemplateContent,
      remainingCredits: updatedUser.creditsLeft,
    },
  });
});

exports.checkUserCredits = catchAsync(async (req, res, next) => {
  const user = req.member || req.organization;
  const userType = req.member ? 'member' : 'organization';

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  let credits;
  if (userType === 'member') {
    credits = await geminiRepository.getMemberCredits(user._id);
  } else {
    credits = await geminiRepository.getOrganizationCredits(user._id);
  }

  res.status(200).json({
    status: 'success',
    data: {
      userType,
      credits,
    },
  });
});
