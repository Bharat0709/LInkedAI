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

const createInitialOrganizationData = (email, timeZone, verificationTokenHash) => {
  return {
    email,
    name: 'EngageGPT User',
    oauthProvider: 'password',
    isVerified: false,
    isActive: false,
    emailVerificationToken: verificationTokenHash,
    emailVerificationExpires: Date.now() + 10 * 60 * 1000, // 10 minutes
    timeZone: timeZone,

    // Initial credits
    credits: {
      balance: 200,
      totalUsed: 0,
      transactions: [
        {
          type: 'bonus',
          amount: 200,
          balance: 200,
          description: 'Initial signup credits',
        },
      ],
    },

    // Default plan features
    planFeatures: {
      aiModels: ['gemini', 'chatgpt'],
      hasPrioritySupport: false,
      canBuyCredits: true,
    },

    // Security defaults
    security: {
      twoFactorEnabled: false,
      lastLoginAt: null,
      failedLoginAttempts: 0,
    },

    // Activity log
    activityLog: [
      {
        action: 'account_created',
        timestamp: new Date(),
        metadata: {
          method: 'email_verification',
          creditsAssigned: 200,
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

    // Initial credits
    credits: {
      balance: 200,
      totalUsed: 0,
      transactions: [
        {
          type: 'bonus',
          amount: 200,
          balance: 200,
          description: 'Initial signup credits (Google OAuth)',
        },
      ],
    },

    // Default plan features
    planFeatures: {
      aiModels: ['gemini', 'chatgpt'],
      hasPrioritySupport: false,
      canBuyCredits: true,
    },

    // Security
    security: {
      twoFactorEnabled: false,
      lastLoginAt: new Date(),
      failedLoginAttempts: 0,
    },

    // Activity log
    activityLog: [
      {
        action: 'account_created',
        timestamp: new Date(),
        metadata: {
          method: 'google_oauth',
          creditsAssigned: 200,
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
