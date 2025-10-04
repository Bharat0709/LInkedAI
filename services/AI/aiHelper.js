const OpenAI = require('openai');
const aiRepository = require('../../repositories/aiRepository');
const AppError = require('../../utils/appError');
const organizationService = require('../Organization/organizationService');

const PROVIDERS = {
  chatgpt: {
    baseURL: 'https://api.openai.com/v1',
    apiKey: process.env.API_KEY_CHATGPT,
    model: 'gpt-4o-mini',
    name: 'ChatGPT',
  },
  groq: {
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.API_KEY_GROQ,
    model: 'llama-3.1-8b-instant',
    name: 'Groq',
  },
  mistral: {
    baseURL: 'https://api.together.xyz/v1',
    apiKey: process.env.API_KEY_TOGETHERAI,
    model: 'mistralai/Mistral-7B-Instruct-v0.1',
    name: 'Mistral',
  },
  perplexity: {
    baseURL: 'https://api.perplexity.ai',
    apikey: process.env.API_KEY_PERPLEXITY,
    model: 'sonar',
    name: 'Perplexity',
  },
};

const CREDIT_COSTS = {
  COMMENT: 5,
  CUSTOM_COMMENT: 5,
  POST_CONTENT: 10,
  MESSAGE_TEMPLATE: 10,
  MESSAGE_REPLY: 10,
};

// Create OpenAI client for specific provider
const createClient = provider => {
  const config = PROVIDERS[provider];
  if (!config) {
    throw new AppError(`Unsupported provider: ${provider}`, 400);
  }

  const apiKey = config.apiKey || config.apikey;
  if (!apiKey) {
    throw new AppError(`API key not found for provider: ${provider}`, 500);
  }

  return new OpenAI({
    baseURL: config.baseURL,
    apiKey: apiKey,
  });
};

// Generic API call function with error handling
const makeAPICall = async (provider, messages, maxTokens = 120, temperature = 0.7) => {
  try {
    const client = createClient(provider);
    const config = PROVIDERS[provider];

    const response = await client.chat.completions.create({
      model: config.model,
      messages,
      max_tokens: maxTokens,
      temperature,
    });

    if (!response.choices || !response.choices[0] || !response.choices[0].message) {
      throw new AppError('Invalid response from AI provider', 500);
    }
    return response.choices[0].message.content;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    // Handle specific API errors
    if (error.status === 429) {
      throw new AppError('AI provider rate limit exceeded', 429);
    }
    if (error.status === 401) {
      throw new AppError('Invalid API key for AI provider', 401);
    }
    if (error.status === 403) {
      throw new AppError('AI provider access forbidden', 403);
    }
    throw new AppError(`AI provider error: ${error.message}`, 500);
  }
};

// Process credits with enhanced error handling
const processCredits = async (userType, userId, creditAmount, feature = 'general', metadata = {}) => {
  try {
    if (userType === 'member') {
      // Find member and organization
      const member = await aiRepository.findMemberById(userId);
      if (!member) throw new AppError('Member not found', 404);

      const organization = await aiRepository.findOrganizationById(member.organizationId);
      if (!organization) throw new AppError('Organization not found', 404);

      // Check if org has enough credits
      if (organization.credits.balance < creditAmount) {
        throw new AppError('Organization does not have enough credits', 403);
      }

      if (member.creditLimitperDay !== -1 && member.creditsUsedToday + creditAmount > member.creditLimitperDay) {
        throw new AppError('Member has exceeded their daily credit limit', 403);
      }

      // Reset member daily credits if date changed
      const today = new Date().toDateString();
      const lastActiveDay = member.lastActive ? member.lastActive.toDateString() : null;
      if (today !== lastActiveDay) {
        member.creditsUsedToday = 0;
      }

      // Deduct from org credits
      const newOrgBalance = organization.credits.balance - creditAmount;
      const orgTransaction = {
        type: 'usage',
        amount: creditAmount,
        balance: newOrgBalance,
        description: `Credits used by member ${member.name} for ${feature}`,
        metadata,
        createdAt: new Date(),
      };

      await aiRepository.updateOrganizationCredits(organization._id, {
        balance: newOrgBalance,
        totalUsed: organization.credits.totalUsed + creditAmount,
        transaction: orgTransaction,
      });

      // Deduct from member usage
      member.creditsUsedToday += creditAmount;
      member.totalCreditsUsed += creditAmount;
      member.lastActive = new Date();
      await aiRepository.updateMemberCredits(member._id, {
        totalCreditsUsed: member.totalCreditsUsed,
        creditsUsedToday: member.creditsUsedToday,
        lastActive: member.lastActive,
      });

      return {
        organization: {
          id: organization._id,
          remainingCredits: newOrgBalance,
        },
        member: {
          id: member._id,
          creditsUsedToday: member.creditsUsedToday,
          creditLimitperDay: member.creditLimitperDay,
          lastActive: member.lastActive,
        },
      };
    } else if (userType === 'organization') {
      // Direct org deduction
      const organization = await aiRepository.findOrganizationById(userId);
      if (!organization) throw new AppError('Organization not found', 404);

      if (organization.credits.balance < creditAmount) {
        throw new AppError('Insufficient credits', 403);
      }

      const newOrgBalance = organization.credits.balance - creditAmount;
      const orgTransaction = {
        type: 'usage',
        amount: creditAmount,
        balance: newOrgBalance,
        description: `Credits used by ${organization.name} for ${feature}`,
        metadata,
        createdAt: new Date(),
      };

      await aiRepository.updateOrganizationCredits(organization._id, {
        balance: newOrgBalance,
        totalUsed: organization.credits.totalUsed + creditAmount,
        transaction: orgTransaction,
      });

      return {
        organization: {
          id: organization._id,
          remainingCredits: newOrgBalance,
        },
      };
    } else {
      throw new AppError('Invalid user type', 400);
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Credit processing failed: ${error.message}`, 500);
  }
};

const checkSubscription = async orgId => {
  const organization = await organizationService.getOrganizationById(orgId);

  if (!organization) {
    throw new AppError('Organization not found', 401);
  }

  // 1. Check if organization is verified
  if (!organization.isVerified) {
    throw new AppError('Organization email is not verified.', 403);
  }

  const { subscription } = organization;
  console.log(subscription);

  if (!subscription || !subscription.plan || !subscription.status) {
    throw new AppError('Organization subscription details are missing.', 403);
  }

  const { plan, status, trialEndDate, renewalDate } = subscription;

  if (plan === 'trial') {
    const now = Date.now();

    if (!trialEndDate || now > new Date(trialEndDate).getTime()) {
      organization.subscription.status = 'expired';
      throw new AppError('Your trial has expired. Please upgrade to perform this action.', 403);
    }
  }

  if (['pro', 'enterprise'].includes(plan)) {
    if (status !== 'active') {
      throw new AppError(`Your subscription is ${status}. Please renew to continue.`, 403);
    }

    if (renewalDate && Date.now() > new Date(renewalDate).getTime()) {
      organization.subscription.status = 'expired';
      throw new AppError('Your subscription has expired. Please renew.', 403);
    }
  }
};

module.exports = {
  processCredits,
  checkSubscription,
  makeAPICall,
  CREDIT_COSTS,
  PROVIDERS,
};
