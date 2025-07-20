const crypto = require('crypto');
const { encryptToken } = require('../../utils/linkedInAuth');

const getTrialInfo = organization => {
  const now = new Date();
  const trialEndDate = organization.subscription.trialEndDate;

  if (organization.subscription.status !== 'trial') {
    return {
      status: organization.subscription.status,
      plan: organization.subscription.plan,
      isInTrial: false,
      trialExpired: false,
      daysRemaining: 0,
      canUpgrade: organization.subscription.status === 'expired',
    };
  }

  const isInTrial = now < trialEndDate;
  const daysRemaining = Math.max(0, Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24)));

  return {
    status: organization.subscription.status,
    plan: organization.subscription.plan,
    isInTrial,
    trialExpired: !isInTrial,
    daysRemaining,
    trialStartDate: organization.subscription.trialStartDate,
    trialEndDate,
    canUpgrade: !isInTrial || organization.subscription.status === 'expired',
    features: organization.planFeatures,
    usage: organization.planUsage,
  };
};

const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const createInitialOrganizationData = (email, timeZone, verificationTokenHash, trialStartDate, trialEndDate, monthStartDate, monthEndDate) => {
  return {
    email,
    name: 'EngageGPT User',
    oauthProvider: 'password',
    isVerified: false,
    isActive: false,
    emailVerificationToken: verificationTokenHash,
    emailVerificationExpires: Date.now() + 10 * 60 * 1000,
    timeZone: timeZone,
    subscription: {
      plan: 'trial',
      status: 'trial',
      trialStartDate: trialStartDate,
      trialEndDate: trialEndDate,
      renewalDate: null,
      canceledAt: null,
      purchasedOn: null,
      isFirstPurchase: true,
    },

    planUsage: {
      maxMembers: 1,
      currentMemberCount: 0,
      monthlyUsage: {
        monthStartDate: monthStartDate,
        monthEndDate: monthEndDate,
        postsSaved: 0,
        maxPostsSavedPerMonth: 50,
        postsScheduled: 0,
        maxPostsScheduledPerMonth: 10,
        contentCalendarDaysAdded: 0,
        maxContentCalendarDays: 30,
        emailsSent: 0,
        maxEmailsPerMonth: 0,
      },
      dailyUsage: {
        date: new Date().toISOString().substring(0, 10),
        aiCreditsUsedToday: {
          viralPostGenerator: 0,
          maxPostGeneratorCreditsperDay: 100,
        },
      },
    },

    planFeatures: {
      aiModels: ['gemini', 'chatgpt'],
      hasPrioritySupport: false,
      canBuyCredits: true,
    },

    security: {
      twoFactorEnabled: false,
      lastLoginAt: null,
      failedLoginAttempts: 0,
    },

    activityLog: [
      {
        action: 'account_created',
        timestamp: new Date(),
        metadata: {
          method: 'email_verification',
          trialStarted: true,
        },
      },
    ],
  };
};

const createGoogleOrganizationData = profile => {
  return {
    email: profile.emails[0].value,
    oauthProvider: 'google',
    name: profile.displayName || 'EngageGPT User',
    profilePicture: profile.photos[0]?.value || null,
    oauthId: encryptToken(profile.id),
    isVerified: true,
    isActive: true,

    subscription: {
      plan: 'trial',
      status: 'trial',
      trialStartDate: new Date(),
      trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days trial
      renewalDate: null,
      canceledAt: null,
      purchasedOn: null,
      isFirstPurchase: true,
    },

    planUsage: {
      maxMembers: 1,
      currentMemberCount: 0,
      monthlyUsage: {
        monthStartDate: new Date(),
        monthEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        postsSaved: 0,
        maxPostsSavedPerMonth: 50,
        postsScheduled: 0,
        maxPostsScheduledPerMonth: 10,
        contentCalendarDaysAdded: 0,
        maxContentCalendarDays: 30,
        emailsSent: 0,
        maxEmailsPerMonth: 0,
      },
      dailyUsage: {
        date: new Date().toISOString().substring(0, 10),
        aiCreditsUsedToday: {
          viralPostGenerator: 0,
          maxPostGeneratorCreditsperDay: 100,
        },
      },
    },

    planFeatures: {
      aiModels: ['gemini', 'chatgpt'],
      hasPrioritySupport: false,
      canBuyCredits: true,
    },

    security: {
      twoFactorEnabled: false,
      lastLoginAt: new Date(),
      failedLoginAttempts: 0,
    },

    activityLog: [
      {
        action: 'account_created',
        timestamp: new Date(),
        metadata: {
          method: 'google_oauth',
          trialStarted: true,
        },
      },
    ],
  };
};

// Password validation helper function
const validatePassword = password => {
  const validation = {
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
  };

  const errors = [];

  if (!validation.minLength) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!validation.hasNumber) {
    errors.push('Password must contain at least one number');
  }
  if (!validation.hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!validation.hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!validation.hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: Object.values(validation).every(Boolean),
    validation,
    errors,
  };
};

module.exports = {
  getTrialInfo,
  generatePasswordResetToken,
  createInitialOrganizationData,
  createGoogleOrganizationData,
  validatePassword,
};
