const dotenv = require('dotenv');
dotenv.config();
const catchAsync = require('../../utils/catchAsync');
const OpenAI = require('openai');
const Member = require('../../models/members');
const Organization = require('../../models/organization');
const { credential } = require('firebase-admin');

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
    model: 'sonar',
    apikey: process.env.API_KEY_PERPLEXITY,
    name: 'Perplexity',
  },
};

// Create OpenAI client for specific provider
const createClient = (provider) => {
  const config = PROVIDERS[provider];
  if (!config) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  if (!config.apiKey) {
    throw new Error(`API key not found for provider: ${provider}`);
  }

  return new OpenAI({
    baseURL: config.baseURL,
    apiKey: config.apiKey,
  });
};

// Generic function to handle credit deduction
const deductCredits = async (user, amount, userType) => {
  if (user.credits < amount) {
    throw new Error('Insufficient credits');
  }
  user.credits -= amount;

  if (userType === 'organization') {
    await Organization.findByIdAndUpdate(user._id, {
      credits: user.credits,
    });
  } else {
    (user.totalCreditsUsed += amount),
      await Member.findByIdAndUpdate(user._id, {
        credits: user.credits,
        totalCreditsUsed: user.totalCreditsUsed,
      });
  }
  return user.credits;
};

// Generic API call function
const makeAPICall = async (provider, messages, maxTokens = 120) => {
  const client = createClient(provider);
  const config = PROVIDERS[provider];

  const response = await client.chat.completions.create({
    model: config.model,
    messages,
    max_tokens: maxTokens,
    temperature: 0.7,
  });

  return response.choices[0].message.content;
};

// Generate Comment Controller
exports.generateComment = catchAsync(async (req, res, next) => {
  try {
    const { postContent, selectedOption, provider = 'openai' } = req.body;
    const user = req.member;

    const remainingCredits = await deductCredits(user, 5);

    const messages = [
      {
        role: 'user',
        content: `As a linkedIn user on behalf of me help me writing a comment in ${selectedOption} tone for a linkedIn Post with the following post content:\n\n${postContent} 
        Requirements: 
        - The comment should be strictly in ${selectedOption} tone only.
        - The comment should be relevant to the whole post content
        - Give response as if a real user have written the comment
        - You can use emojis as well if its a congratulatory comment
        - Do not repeat the exact words written in the post
        - Give result in a single paragraph and not greater than 30 words  
        - Do not include double quotes in response
        - Do not include hashtags in response 
        - Give a short and engaging comment 
        - Comment should not seem to be written by AI`,
      },
    ];

    const generatedComment = await makeAPICall(provider, messages, 150);

    res.status(200).json({
      generatedComment,
      remainingCredits,
      provider: PROVIDERS[provider].name,
    });
  } catch (error) {
    if (error.message === 'Insufficient credits') {
      return res.status(403).json({ error: 'Insufficient credits' });
    }
    console.error('Error generating comment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Generate Custom Comment Controller
exports.generateCustomComment = catchAsync(async (req, res, next) => {
  try {
    const {
      postContent,
      customTone,
      wordCount,
      provider = 'openai',
    } = req.body;
    const user = req.member;

    const remainingCredits = await deductCredits(user, 5);

    const messages = [
      {
        role: 'user',
        content: `As a linkedIn user from India on behalf of me help me write a comment for a linkedIn Post in the ${customTone} tone with the following post content:\n\n${postContent} in ${wordCount} words
        Requirements:
        - You can use emojis as well if its a congratulatory comment
        - The comment should strictly be in ${customTone} only
        - Give response as if a real user have written the comment
        - The comment should be relevant to the whole post content
        - Do not repeat the exact words written in the post.
        - Do not include double quotes in response
        - Do not include hashtags in response 
        - Give engaging comment & complete the comment within the word limit 
        - The comment should not seem to be written by AI`,
      },
    ];

    const generatedComment = await makeAPICall(provider, messages, 200);

    res.status(200).json({
      generatedComment,
      remainingCredits,
      provider: PROVIDERS[provider].name,
    });
  } catch (error) {
    if (error.message === 'Insufficient credits') {
      return res.status(403).json({ error: 'Insufficient credits' });
    }
    console.error('Error generating custom comment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Generate Post Content Controller
exports.generatePostContent = catchAsync(async (req, res, next) => {
  try {
    const { postType, selectedTone, provider = 'openai' } = req.body;
    let user;
    let userType;
    if (req?.member) {
      userType = 'member';
      user = req.member;
    } else {
      userType = 'organization';
      user = req.organization;
    }
    const remainingCredits = await deductCredits(user, 10, userType);

    const messages = [
      {
        role: 'user',
        content: `As a linkedIn user i want you to make a ${selectedTone} LinkedIn post for me with the following specifications:

        Post Topic is about ${postType}
  
        Requirements:
        - Include emojis to add a touch of personality.
        - Do not include ** or * before, after or in between the words the text in the response
        - Incorporate relevant hashtags for increased visibility.
        - Start the post with a compelling hook line to engage the audience.
        - Give the content in points and understand what kind of content will suite the audience the best as per the post content requirements
        - Should have one link attached that is related to post content helpful for the audience if any
        - Prompt followers to share their thoughts or experiences related to the post.
        - Ensure the post fits within LinkedIn's character limit for optimal engagement
        - Leverage current events or industry trends to make the post timely and relevant.
        - Use simple and easy to understand words in the post
        - The post should not seem to be written by AI
        - Complete the post within approx 900 words`,
      },
    ];

    const generatedPostContent = await makeAPICall(provider, messages, 1500);

    res.status(200).json({
      generatedPostContent,
      remainingCredits,
      provider: PROVIDERS[provider].name,
    });
  } catch (error) {
    if (error.message === 'Insufficient credits') {
      return res.status(403).json({ error: 'Insufficient credits' });
    }
    console.error('Error generating post content:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Generate Template Controller
exports.generateMessageTemplate = catchAsync(async (req, res, next) => {
  try {
    const {
      templateRequirements,
      selectedTone,
      provider = 'openai',
    } = req.body;
    const user = req.member;

    const remainingCredits = await deductCredits(user, 10);

    const messages = [
      {
        role: 'user',
        content: `Generate a ${selectedTone} message template for linkedin with the following purpose:

        Template is about ${templateRequirements}

        Requirements:
        - Template should be short and to the point
        - Should be completed in 200 words
        - Message Template should be professional.
        - If template is about applying for job then attach resume and skills in the message and message should be professional`,
      },
    ];

    const generatedTemplateContent = await makeAPICall(provider, messages, 300);

    res.status(200).json({
      generatedTemplateContent,
      remainingCredits,
      provider: PROVIDERS[provider].name,
    });
  } catch (error) {
    if (error.message === 'Insufficient credits') {
      return res.status(403).json({ error: 'Insufficient credits' });
    }
    console.error('Error generating template:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Generate Reply Controller
exports.generateMessageReply = catchAsync(async (req, res, next) => {
  try {
    const { formattedMessages, userName, provider = 'openai' } = req.body;
    const user = req.member;

    const remainingCredits = await deductCredits(user, 10);

    const messages = [
      {
        role: 'user',
        content: `My name is ${userName} and on behalf of me Generate a formal reply to these messages from linkedin with the following last 5 conversation:

        ${formattedMessages}

        If there is no message from the other side except for ${userName} that is me then send a default one to start a conversation.
        Requirements:
        - Reply should be short and to the point
        - Should be completed in 50 words
        - Reply should be professional.`,
      },
    ];

    const generatedReply = await makeAPICall(provider, messages, 100);

    res.status(200).json({
      generatedReply,
      remainingCredits,
      provider: PROVIDERS[provider].name,
    });
  } catch (error) {
    if (error.message === 'Insufficient credits') {
      return res.status(403).json({ error: 'Insufficient credits' });
    }
    console.error('Error generating reply:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get Available Providers
exports.getProviders = catchAsync(async (req, res, next) => {
  const availableProviders = Object.keys(PROVIDERS).map((key) => ({
    key,
    name: PROVIDERS[key].name,
    model: PROVIDERS[key].model,
  }));

  res.status(200).json({
    providers: availableProviders,
  });
});

// Health Check for Provider
exports.checkProviderHealth = catchAsync(async (req, res, next) => {
  const { provider } = req.params;

  try {
    const client = createClient(provider);
    const config = PROVIDERS[provider];

    // Simple test call
    await client.chat.completions.create({
      model: config.model,
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5,
    });

    res.status(200).json({
      provider: config.name,
      status: 'healthy',
      model: config.model,
    });
  } catch (error) {
    res.status(500).json({
      provider: PROVIDERS[provider]?.name || provider,
      status: 'unhealthy',
      error: error.message,
    });
  }
});
