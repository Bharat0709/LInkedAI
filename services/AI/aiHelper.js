const OpenAI = require('openai');
const aiRepository = require('../../repositories/aiRepository');
const AppError = require('../../utils/appError');

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
const processCredits = async (userType, userId, creditAmount) => {
  try {
    let hasEnoughCredits;
    let updatedUser;

    if (userType === 'member') {
      hasEnoughCredits = await aiRepository.checkMemberCredits(userId, creditAmount);
      if (!hasEnoughCredits) {
        throw new AppError('Insufficient credits', 403);
      }
      updatedUser = await aiRepository.updateMemberCredits(userId, creditAmount);
      return {
        remainingCredits: updatedUser.creditsLeft,
        user: updatedUser,
      };
    } else if (userType === 'organization') {
      hasEnoughCredits = await aiRepository.checkOrganizationCredits(userId, creditAmount);
      if (!hasEnoughCredits) {
        throw new AppError('Insufficient credits', 403);
      }
      updatedUser = await aiRepository.updateOrganizationCredits(userId, creditAmount);
      return {
        remainingCredits: updatedUser.credits,
        user: updatedUser,
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

module.exports = {
  processCredits,
  makeAPICall,
  CREDIT_COSTS,
  PROVIDERS,
};
