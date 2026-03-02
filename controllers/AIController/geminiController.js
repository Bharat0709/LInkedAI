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
  const updatedUser = await aiHelper.processCredits('member', user._id, CREDITS_CONFIG.COMMENT_GENERATION, 'Comment Generation using Gemini');

  // Generate comment
  const generatedComment = await geminiService.generateComment(user._id, postContent, selectedOption);

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
  const updatedUser = await aiHelper.processCredits('member', user._id, CREDITS_CONFIG.COMMENT_GENERATION, 'custom comment generation');

  // Generate custom comment
  const generatedComment = await geminiService.generateCustomComment(user._id, postContent, customTone, wordCount);

  res.status(200).json({
    status: 'success',
    generatedComment,
    remainingCredits: updatedUser.creditsLeft,
  });
});

exports.generatePostContentGemini = catchAsync(async (req, res, next) => {
  const { postType, selectedTone } = req.body;

  if (!postType || !selectedTone) {
    return next(new AppError('Post type and selected tone are required', 400));
  }

  const organization = req.organization;
  if (!organization) {
    return next(new AppError('Organization not found', 404));
  }

  // Verify and deduct credits
  const updatedUser = await aiHelper.processCredits('organization', organization._id, CREDITS_CONFIG.POST_GENERATION, 'Post Generation using Gemini');

  // Generate post content
  const generatedPostContent = await geminiService.generatePostContent(organization._id, postType, selectedTone);

  res.status(200).json({
    status: 'success',
    generatedPostContent,
    remainingCredits: updatedUser.creditsLeft,
  });
});

exports.generatePostContentGeminiExtn = catchAsync(async (req, res, next) => {
  const { postType, selectedTone } = req.body;
  if (!postType || !selectedTone) {
    return next(new AppError('Post type and selected tone are required', 400));
  }

  const member = req.member;
  if (!member) {
    return next(new AppError('Organization not found', 404));
  }

  // Verify and deduct credits
  const updatedUser = await aiHelper.processCredits('member', member._id, CREDITS_CONFIG.POST_GENERATION, 'Post Generation using Gemini');

  // Generate post content
  const generatedPostContent = await geminiService.generatePostContent(member._id, postType, selectedTone);

  res.status(200).json({
    status: 'success',
    generatedPostContent,
    remainingCredits: updatedUser.creditsLeft,
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
  const updatedOrganization = await aiHelper.processCredits('organization', organization._id, CREDITS_CONFIG.POST_GENERATION, 'post generation');

  // Generate post content with persona
  const generatedPostContent = await geminiService.generateOrganizationPostContentWithPersona(organization._id, postType, selectedTone, language, persona);

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
  const generatedPostContent = await geminiService.generateOrganizationPostContentWithTemplate(organization._id, postType, selectedTone, language, template);

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
  const updatedUser = await aiHelper.processCredits('member', user._id, CREDITS_CONFIG.TEMPLATE_GENERATION, 'template generation');

  // Generate template
  const generatedTemplateContent = await geminiService.generateTemplate(user._id, templateRequirements, selectedTone);

  res.status(200).json({
    status: 'success',
    data: {
      generatedTemplateContent,
      remainingCredits: updatedUser.creditsLeft,
    },
  });
});

exports.generateEmailTemplateGemini = catchAsync(async (req, res, next) => {
  const { format, templateType, prompt } = req.body;

  if (!format || !templateType) {
    return next(new AppError('Email format and template type are required', 400));
  }

  const user = req.organization;
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Generate email template
  const generatedEmailTemplate = await geminiService.generateEmailTemplate(user._id, format, templateType, prompt);
  res.status(200).json({
    status: 'success',
    data: {
      generatedEmailTemplate,
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
