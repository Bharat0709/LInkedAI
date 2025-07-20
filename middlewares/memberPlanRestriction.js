const memberRepository = require('../repositories/memberRepository');
const organizationRepository = require('../repositories/organizationRepository');
const { checkAndUpdateTrialStatus } = require('../services/Organization/organizationHelper');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const checkMemberPlanRestrictions = catchAsync(async (req, res, next) => {
  const memberId = req.member?._id;
  const organizationId = req.organization?._id;

  if (!memberId || !organizationId) {
    return next(new AppError('Member or organization not found', 401));
  }

  // Get fresh member and organization data
  const member = await memberRepository.findById(memberId);
  const organization = await organizationRepository.findById(organizationId);

  if (!member || !organization) {
    return next(new AppError('Member or organization not found', 404));
  }

  // Check trial status
  const trialStatus = await checkAndUpdateTrialStatus(organizationId);
  if (trialStatus.trialExpired) {
    return next(new AppError('Trial period has expired. Please upgrade your subscription.', 403));
  }

  // Check if member has sufficient credits
  if (member.creditsLeft <= 0) {
    return next(new AppError('Insufficient credits. Please wait for daily credit reset.', 403));
  }

  // Check organization plan limits
  const { planUsage, subscription } = organization;
  const currentTime = new Date();
  const monthStart = new Date(planUsage.monthlyUsage.monthStartDate);
  const monthEnd = new Date(planUsage.monthlyUsage.monthEndDate);

  // Reset monthly usage if month has passed
  if (currentTime > monthEnd) {
    const newMonthStart = new Date();
    const newMonthEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await organizationRepository.updateById(organizationId, {
      'planUsage.monthlyUsage.monthStartDate': newMonthStart,
      'planUsage.monthlyUsage.monthEndDate': newMonthEnd,
      'planUsage.monthlyUsage.postsSaved': 0,
      'planUsage.monthlyUsage.postsScheduled': 0,
      'planUsage.monthlyUsage.emailsSent': 0,
      'planUsage.monthlyUsage.contentCalendarDaysAdded': 0,
    });
  }

  // Store current limits in request for controllers to use
  req.memberLimits = {
    creditsLeft: member.creditsLeft,
    creditLimitPerDay: member.creditLimitperDay,
    canProceed: true,
    trialStatus,
  };

  req.organizationLimits = {
    monthlyUsage: planUsage.monthlyUsage,
    dailyUsage: planUsage.dailyUsage,
    planFeatures: organization.planFeatures,
    subscription: subscription,
  };

  next();
});

const checkFeatureAccess = feature => {
  return catchAsync(async (req, res, next) => {
    const organization = req.organization;
    const member = req.member;

    if (!organization || !member) {
      return next(new AppError('Access denied', 401));
    }

    const { planFeatures, subscription } = organization;

    // Check feature-specific restrictions
    switch (feature) {
      case 'ai_models':
        const requestedModel = req.body.model || req.query.model;
        if (requestedModel && !planFeatures.aiModels.includes(requestedModel)) {
          return next(new AppError(`AI model '${requestedModel}' not available in your plan`, 403));
        }
        break;

      case 'priority_support':
        if (!planFeatures.hasPrioritySupport) {
          return next(new AppError('Priority support not available in your plan', 403));
        }
        break;

      case 'buy_credits':
        if (!planFeatures.canBuyCredits) {
          return next(new AppError('Credit purchase not available in your plan', 403));
        }
        break;

      case 'custom_ai_comments':
        if (!member.hasCustomAIComments) {
          return next(new AppError('Custom AI comments not available in your plan', 403));
        }
        break;

      case 'advanced_post_saving':
        if (subscription.plan === 'trial') {
          const { postSavingPreferences } = member;
          if (postSavingPreferences.enableCustomKeywords || postSavingPreferences.customCategories.length > 0) {
            return next(new AppError('Advanced post saving features not available in trial plan', 403));
          }
        }
        break;

      default:
        break;
    }

    next();
  });
};

const checkUsageLimits = usageType => {
  return catchAsync(async (req, res, next) => {
    const organizationId = req.organization?._id;
    const memberId = req.member?._id;

    if (!organizationId || !memberId) {
      return next(new AppError('Access denied', 401));
    }

    const organization = await organizationRepository.findById(organizationId);
    const member = await memberRepository.findById(memberId);

    if (!organization || !member) {
      return next(new AppError('Organization or member not found', 404));
    }

    const { planUsage } = organization;
    const { monthlyUsage, dailyUsage } = planUsage;

    // Check usage limits based on type
    switch (usageType) {
      case 'posts_saved':
        if (monthlyUsage.postsSaved >= monthlyUsage.maxPostsSavedPerMonth) {
          return next(new AppError('Monthly posts saved limit reached', 403));
        }
        break;

      case 'posts_scheduled':
        if (monthlyUsage.postsScheduled >= monthlyUsage.maxPostsScheduledPerMonth) {
          return next(new AppError('Monthly scheduled posts limit reached', 403));
        }
        break;

      case 'emails_sent':
        if (monthlyUsage.emailsSent >= monthlyUsage.maxEmailsPerMonth) {
          return next(new AppError('Monthly emails limit reached', 403));
        }
        break;

      case 'ai_credits':
        const today = new Date().toISOString().substring(0, 10);
        if (dailyUsage.date !== today) {
          // Reset daily usage
          await organizationRepository.updateById(organizationId, {
            'planUsage.dailyUsage.date': today,
            'planUsage.dailyUsage.aiCreditsUsedToday.viralPostGenerator': 0,
          });
        } else if (dailyUsage.aiCreditsUsedToday.viralPostGenerator >= dailyUsage.aiCreditsUsedToday.maxPostGeneratorCreditsperDay) {
          return next(new AppError('Daily AI credits limit reached', 403));
        }
        break;

      case 'member_credits':
        if (member.creditsLeft <= 0) {
          return next(new AppError('Insufficient member credits', 403));
        }
        break;

      default:
        break;
    }

    next();
  });
};

const rateLimitByPlan = catchAsync(async (req, res, next) => {
  const organization = req.organization;

  if (!organization) {
    return next(new AppError('Access denied', 401));
  }

  const { subscription } = organization;
  const userKey = `${req.member._id}_${Date.now()}`;

  // Set rate limits based on plan
  let requestsPerMinute;
  switch (subscription.plan) {
    case 'trial':
      requestsPerMinute = 10;
      break;
    case 'pro':
      requestsPerMinute = 30;
      break;
    case 'enterprise':
      requestsPerMinute = 100;
      break;
    default:
      requestsPerMinute = 5;
  }

  // Simple in-memory rate limiting (in production, use Redis)
  if (!global.rateLimitStore) {
    global.rateLimitStore = new Map();
  }

  const now = Date.now();
  const windowStart = Math.floor(now / 60000) * 60000; // 1-minute window
  const key = `${userKey}_${windowStart}`;

  const currentCount = global.rateLimitStore.get(key) || 0;

  if (currentCount >= requestsPerMinute) {
    return next(new AppError('Rate limit exceeded. Please try again later.', 429));
  }

  global.rateLimitStore.set(key, currentCount + 1);

  // Clean up old entries
  setTimeout(() => {
    global.rateLimitStore.delete(key);
  }, 60000);

  next();
});

module.exports = {
  checkMemberPlanRestrictions,
  checkFeatureAccess,
  checkUsageLimits,
  rateLimitByPlan,
};
