const catchAsync = require('../../utils/catchAsync');
const openaiService = require('../../services/AI/openaiService');
const AppError = require('../../utils/appError');
const { UserMetadata } = require('firebase-admin/auth');

const getUserTypeAndId = async req => {
  if (req.member) {
    return { userType: 'member', userId: req.member._id };
  }
  if (req.organization) {
    return { userType: 'organization', userId: req.organization._id };
  }
  throw new AppError('User authentication required', 401);
};

// Generate Comment Controller
exports.generateComment = catchAsync(async (req, res, next) => {
  const { postContent, selectedOption, provider = 'chatgpt' } = req.body;
  const { userType, userId } = await getUserTypeAndId(req);

  const result = await openaiService.generateComment(userType, userId, postContent, selectedOption, provider);

  res.status(200).json({
    status: 'success',
    ...result,
  });
});

// Generate Custom Comment Controller
exports.generateCustomComment = catchAsync(async (req, res, next) => {
  const { postContent, customTone, wordCount, provider = 'chatgpt' } = req.body;
  const { userType, userId } = await getUserTypeAndId(req);

  const result = await openaiService.generateCustomComment(userType, userId, postContent, customTone, wordCount, provider);

  res.status(200).json({
    status: 'success',
    ...result,
  });
});

// Generate Post Content Controller
exports.generatePostContent = catchAsync(async (req, res, next) => {
  const { postType, selectedTone, provider = 'chatgpt' } = req.body;
  const { userType, userId } = await getUserTypeAndId(req);

  const result = await openaiService.generatePostContent(userType, userId, postType, selectedTone, provider);

  res.status(200).json({
    status: 'success',
    ...result,
  });
});

// Generate Message Template Controller
exports.generateMessageTemplate = catchAsync(async (req, res, next) => {
  const { templateRequirements, selectedTone, provider = 'chatgpt' } = req.body;
  const { userType, userId } = await getUserTypeAndId(req);

  const result = await openaiService.generateMessageTemplate(userType, userId, templateRequirements, selectedTone, provider);

  res.status(200).json({
    status: 'success',
    ...result,
  });
});

// Generate Message Reply Controller
exports.generateMessageReply = catchAsync(async (req, res, next) => {
  const { formattedMessages, userName, provider = 'chatgpt' } = req.body;
  const { userType, userId } = await getUserTypeAndId(req);
  console.log(formattedMessages , userName , provider)

  const result = await openaiService.generateMessageReply(userType, userId, formattedMessages, userName, provider);

  res.status(200).json({
    status: 'success',
    ...result,
  });
});

// Get Available Providers Controller
exports.getProviders = catchAsync(async (req, res, next) => {
  const providers = openaiService.getAvailableProviders();

  res.status(200).json({
    status: 'success',
    data: {
      providers,
    },
  });
});

// Health Check for Provider Controller
exports.checkProviderHealth = catchAsync(async (req, res, next) => {
  const { provider } = req.params;
  const healthStatus = await openaiService.checkProviderHealth(provider);

  const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

  res.status(statusCode).json({
    status: healthStatus.status === 'healthy' ? 'success' : 'error',
    healthStatus,
  });
});
