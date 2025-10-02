const mailService = require('../../admin/email/admin');
const AppError = require('../../utils/appError');
const fileUploadService = require('../../utils/fileUploadService');
const organizationRepository = require('../../repositories/organizationRepository');
const { logActivity, checkAndUpdateTrialStatus } = require('./organizationHelper');

const getOrganizationById = async id => {
  const organization = await organizationRepository.findById(id);
  if (!organization) {
    throw new AppError('Organization not found.', 404);
  }
  return organization;
};

const checkVerificationStatus = async email => {
  if (!email) {
    throw new AppError('Email is Required', 400);
  }
  const organization = await organizationRepository.findByEmail(email);
  if (organization.isVerified === true) {
    return true;
  } else return false;
};

const updateProfile = async (organizationId, profileData, file) => {
  if (!profileData.name && !file) {
    throw new AppError('Please provide either a name or a profile picture to update.', 400);
  }

  // Check if organization exists
  const organization = await organizationRepository.findById(organizationId);

  if (!organization) {
    throw new AppError('Organization not found.', 404);
  }

  // Prepare update data
  const updateData = {};
  if (profileData.name) updateData.name = profileData.name;

  // Handle file upload if provided
  if (file) {
    const profilePictureUrl = await fileUploadService.uploadProfilePicture(organizationId, file);
    updateData.profilePicture = profilePictureUrl;
  }

  // Update organization profile
  const updatedOrganization = await organizationRepository.updateProfile(organizationId, updateData);

  // Log activity
  await logActivity(organizationId, 'profile_updated', {
    updatedFields: Object.keys(updateData),
  });

  return updatedOrganization;
};

const sendHelpRequestHandler = async (organization, helpTextContent) => {
  // Validate input
  if (!helpTextContent) {
    throw new AppError('Please provide the help text content.', 400);
  }

  // Validate organization
  if (!organization || !organization.email) {
    throw new AppError('Organization details are missing.', 404);
  }

  // Send help request email
  await mailService.sendHelpRequest(organization, helpTextContent);

  // Log activity
  await logActivity(organization._id, 'help_request_sent', {
    helpTextContent: helpTextContent.substring(0, 100) + '...', // Log first 100 chars
  });

  return {
    message: 'Help request has been sent successfully.',
  };
};

const sendFeedbackHandler = async (organization, rating, feedbackContent) => {
  // Validate input
  if (!feedbackContent) {
    throw new AppError('Please provide the feedback content.', 400);
  }

  // Validate organization
  if (!organization || !organization.email) {
    throw new AppError('Organization details are missing.', 404);
  }

  // Validate rating if provided
  if (rating && (rating < 1 || rating > 5)) {
    throw new AppError('Rating must be between 1 and 5.', 400);
  }

  // Send feedback email
  await mailService.sendFeedback(organization, rating, feedbackContent);

  // Log activity
  await logActivity(organization._id, 'feedback_sent', {
    rating,
    feedbackContent: feedbackContent.substring(0, 100) + '...', // Log first 100 chars
  });

  return {
    message: 'Feedback has been sent successfully.',
  };
};

const createOrganization = async organizationData => {
  // Business logic validations
  const existingOrg = await organizationRepository.findByEmail(organizationData.email);
  if (existingOrg) {
    throw new AppError('Organization with this email already exists.', 409);
  }

  const organization = await organizationRepository.create(organizationData);

  // Log activity
  await logActivity(organization._id, 'organization_created', {
    createdAt: new Date(),
  });

  return organization;
};

const deleteOrganization = async (id, softDelete = true) => {
  const organization = await organizationRepository.findById(id);
  if (!organization) {
    throw new AppError('Organization not found.', 404);
  }

  let result;
  if (softDelete) {
    result = await organizationRepository.softDelete(id);
    await logActivity(id, 'organization_soft_deleted', {
      deletedAt: new Date(),
    });
  } else {
    result = await organizationRepository.deletedOrganization(id);
  }

  return result;
};

const getOrganizationProfile = async id => {
  const organization = await organizationRepository.findById(id);
  if (!organization) {
    throw new AppError('Organization not found.', 404);
  }

  return {
    id: organization._id,
    profilePicture: organization.profilePicture,
    name: organization.name,
    timeZone: organization.timeZone,
    lastActive: organization.lastActive,
    email: organization.email,
    credits: organization.credits,
    referralInfo: organization.referral,
    planFeatures: organization.planFeatures,
    createdAt: organization.createdAt,
    isVerified: organization.isVerified,
    oauthProvider: organization.oauthProvider,
    isActive: organization.isActive,
    lastActive: organization.lastActive,
    billingDetails: organization.billingDetails,
  };
};

const getOrganizationCredits = async id => {
  const organization = await organizationRepository.findById(id);
  if (!organization) {
    throw new AppError('Organization not found.', 404);
  }

  const { credits, totalCreditsUsed } = await organizationRepository.getOrganizationCredits(organization._id);

  return {
    success: true,
    credits: credits,
    totalCreditsUsed: totalCreditsUsed,
  };
};

const updateCredits = async (organizationId, creditsUsed) => {
  const organization = await organizationRepository.findById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found.', 404);
  }

  // Check trial status first
  const trialStatus = await checkAndUpdateTrialStatus(organizationId);
  if (trialStatus.trialExpired) {
    throw new AppError('Trial period has expired. Please upgrade your subscription.', 403);
  }

  const newTotalCreditsUsed = organization.totalCreditsUsed + creditsUsed;

  const updatedOrganization = await organizationRepository.updateById(organizationId, { totalCreditsUsed: newTotalCreditsUsed });

  // Log activity
  await logActivity(organizationId, 'credits_used', {
    creditsUsed,
    totalCreditsUsed: newTotalCreditsUsed,
    previousTotal: organization.totalCreditsUsed,
  });

  return updatedOrganization;
};

const updateSubscription = async (organizationId, subscriptionData) => {
  const organization = await organizationRepository.findById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found.', 404);
  }

  // Handle subscription upgrade from trial
  if (organization.subscription.status === 'trial' && subscriptionData.status === 'active') {
    subscriptionData.purchasedOn = new Date();
    subscriptionData.isFirstPurchase = organization.subscription.isFirstPurchase;

    // Set renewal date based on plan
    if (subscriptionData.plan === 'pro' || subscriptionData.plan === 'enterprise') {
      subscriptionData.renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    }
  }

  // Handle subscription cancellation
  if (subscriptionData.status === 'canceled') {
    subscriptionData.canceledAt = new Date();
  }

  const updatedOrganization = await organizationRepository.updateById(organizationId, { subscription: { ...organization.subscription, ...subscriptionData } });

  // Log activity
  await logActivity(organizationId, 'subscription_updated', {
    previousSubscription: organization.subscription,
    newSubscription: subscriptionData,
  });

  return updatedOrganization;
};

const checkUsageLimits = async (organizationId, usageType) => {
  const organization = await organizationRepository.findById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found.', 404);
  }

  // Check trial status
  const trialStatus = await checkAndUpdateTrialStatus(organizationId);
  if (trialStatus.trialExpired) {
    throw new AppError('Trial period has expired. Please upgrade your subscription.', 403);
  }

  const { planUsage, subscription } = organization;
  const { monthlyUsage, dailyUsage } = planUsage;

  // Check monthly limits based on usage type
  switch (usageType) {
    case 'postsSaved':
      if (monthlyUsage.postsSaved >= monthlyUsage.maxPostsSavedPerMonth) {
        throw new AppError('Monthly posts saved limit reached. Please upgrade your plan.', 403);
      }
      break;
    case 'postsScheduled':
      if (monthlyUsage.postsScheduled >= monthlyUsage.maxPostsScheduledPerMonth) {
        throw new AppError('Monthly scheduled posts limit reached. Please upgrade your plan.', 403);
      }
      break;
    case 'emailsSent':
      if (monthlyUsage.emailsSent >= monthlyUsage.maxEmailsPerMonth) {
        throw new AppError('Monthly emails limit reached. Please upgrade your plan.', 403);
      }
      break;
    case 'aiCredits':
      if (dailyUsage.aiCreditsUsedToday.viralPostGenerator >= dailyUsage.aiCreditsUsedToday.maxPostGeneratorCreditsperDay) {
        throw new AppError('Daily AI credits limit reached. Please try again tomorrow or upgrade your plan.', 403);
      }
      break;
    default:
      break;
  }

  return {
    canProceed: true,
    currentUsage: monthlyUsage,
    trialStatus,
  };
};

const incrementUsage = async (organizationId, usageType, amount = 1) => {
  const organization = await organizationRepository.findById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found.', 404);
  }

  const updateData = {};
  const today = new Date().toISOString().substring(0, 10);

  // Reset daily usage if it's a new day
  if (organization.planUsage.dailyUsage.date !== today) {
    updateData['planUsage.dailyUsage.date'] = today;
    updateData['planUsage.dailyUsage.aiCreditsUsedToday.viralPostGenerator'] = 0;
  }

  // Increment usage based on type
  switch (usageType) {
    case 'postsSaved':
      updateData['planUsage.monthlyUsage.postsSaved'] = organization.planUsage.monthlyUsage.postsSaved + amount;
      break;
    case 'postsScheduled':
      updateData['planUsage.monthlyUsage.postsScheduled'] = organization.planUsage.monthlyUsage.postsScheduled + amount;
      break;
    case 'emailsSent':
      updateData['planUsage.monthlyUsage.emailsSent'] = organization.planUsage.monthlyUsage.emailsSent + amount;
      break;
    case 'aiCredits':
      const currentAICredits = organization.planUsage.dailyUsage.date === today ? organization.planUsage.dailyUsage.aiCreditsUsedToday.viralPostGenerator : 0;
      updateData['planUsage.dailyUsage.aiCreditsUsedToday.viralPostGenerator'] = currentAICredits + amount;
      break;
  }

  const updatedOrganization = await organizationRepository.updateById(organizationId, updateData);

  // Log activity
  await logActivity(organizationId, 'usage_incremented', {
    usageType,
    amount,
    newUsage: updateData,
  });

  return updatedOrganization;
};

module.exports = {
  // Read / Retrieve
  getOrganizationById,
  getOrganizationProfile,
  getOrganizationCredits,

  // Create / Update
  createOrganization,
  updateProfile,
  updateSubscription,
  updateCredits,

  // Delete
  deleteOrganization,
  checkUsageLimits,
  incrementUsage,
  checkVerificationStatus,

  // Communication
  sendHelpRequest: sendHelpRequestHandler,
  sendFeedback: sendFeedbackHandler,
};
