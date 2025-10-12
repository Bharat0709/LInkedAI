const AppError = require('../../utils/appError');
const { logActivity } = require('../Organization/organizationHelper');
const aiHelper = require('./aiHelper');

// Generate Comment Service
const generateComment = async (userType, userId, postContent, selectedOption, provider = 'chatgpt') => {
  if (!postContent || !selectedOption) {
    throw new AppError('Post content and tone are required', 400);
  }

  // Process credits first
  const creditResult = await aiHelper.processCredits(userType, userId, aiHelper.CREDIT_COSTS.COMMENT, 'Comment Generation using ' + provider);

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

  const generatedComment = await aiHelper.makeAPICall(provider, messages, 150);

  await logActivity(userId, 'credits_used', {
    creditsUsed: aiHelper.CREDIT_COSTS.COMMENT,
    service: 'comment',
    provider: aiHelper.PROVIDERS[provider].name,
    postContentLength: postContent.length,
    tone: selectedOption,
  });

  return {
    generatedComment: generatedComment.trim(),
    remainingCredits: creditResult.remainingCredits,
    provider: aiHelper.PROVIDERS[provider].name,
  };
};

// Generate Custom Comment Service
const generateCustomComment = async (userType, userId, postContent, customTone, wordCount, provider = 'chatgpt') => {
  if (!postContent || !customTone || !wordCount) {
    throw new AppError('Post content, custom tone, and word count are required', 400);
  }

  if (wordCount < 5 || wordCount > 100) {
    throw new AppError('Word count must be between 5 and 100', 400);
  }

  // Process credits first
  const creditResult = await aiHelper.processCredits(userType, userId, aiHelper.CREDIT_COSTS.CUSTOM_COMMENT, 'Custom Comment using ' + provider);

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

  const generatedComment = await aiHelper.makeAPICall(provider, messages, 200);

  await logActivity(userId, 'credits_used', {
    creditsUsed: aiHelper.CREDIT_COSTS.CUSTOM_COMMENT,
    service: 'custom_comment',
    provider: aiHelper.PROVIDERS[provider].name,
    postContentLength: postContent.length,
    tone: customTone,
    wordCount: wordCount,
  });

  return {
    generatedComment: generatedComment.trim(),
    remainingCredits: creditResult.remainingCredits,
    provider: aiHelper.PROVIDERS[provider].name,
  };
};

// Generate Post Content Service
const generatePostContent = async (userType, userId, postType, selectedTone, provider = 'chatgpt') => {
  if (!postType || !selectedTone) {
    throw new AppError('Post type and tone are required', 400);
  }

  // Process credits first
  const creditResult = await aiHelper.processCredits(userType, userId, aiHelper.CREDIT_COSTS.POST_CONTENT, 'Post Content using ' + provider);

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

  const generatedPostContent = await aiHelper.makeAPICall(provider, messages, 1500);

  await logActivity(userId, 'credits_used', {
    creditsUsed: aiHelper.CREDIT_COSTS.POST_CONTENT,
    service: 'post_content',
    provider: aiHelper.PROVIDERS[provider].name,
    postType: postType,
    tone: selectedTone,
  });

  return {
    generatedPostContent: generatedPostContent.trim(),
    remainingCredits: creditResult.remainingCredits,
    provider: aiHelper.PROVIDERS[provider].name,
  };
};

// Generate Message Template Service
const generateMessageTemplate = async (userType, userId, templateRequirements, selectedTone, provider = 'chatgpt') => {
  if (!templateRequirements || !selectedTone) {
    throw new AppError('Template requirements and tone are required', 400);
  }

  // Process credits first
  const creditResult = await aiHelper.processCredits(userType, userId, aiHelper.CREDIT_COSTS.MESSAGE_TEMPLATE, 'Message Template');

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

  const generatedTemplateContent = await aiHelper.makeAPICall(provider, messages, 300);
  await logActivity(userId, 'credits_used', {
    creditsUsed: aiHelper.CREDIT_COSTS.MESSAGE_TEMPLATE,
    service: 'message_template',
    provider: aiHelper.PROVIDERS[provider].name,
    tone: selectedTone,
    requirementsLength: templateRequirements.length,
  });

  return {
    generatedTemplateContent: generatedTemplateContent.trim(),
    remainingCredits: creditResult.remainingCredits,
    provider: aiHelper.PROVIDERS[provider].name,
  };
};

// Generate Message Reply Service
const generateMessageReply = async (userType, userId, formattedMessages, userName, provider = 'chatgpt') => {
  if (!formattedMessages || !userName) {
    throw new AppError('Messages and user name are required', 400);
  }

  // Process credits first
  const creditResult = await aiHelper.processCredits(userType, userId, aiHelper.CREDIT_COSTS.MESSAGE_REPLY, 'Message Reply');

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

  const generatedReply = await aiHelper.makeAPICall(provider, messages, 100);
  await logActivity(userId, 'credits_used', {
    creditsUsed: aiHelper.CREDIT_COSTS.MESSAGE_REPLY,
    service: 'message_reply',
    provider: aiHelper.PROVIDERS[provider].name,
    userName: userName,
    messagesLength: formattedMessages.length,
  });

  return {
    generatedReply: generatedReply.trim(),
    remainingCredits: creditResult.remainingCredits,
    provider: aiHelper.PROVIDERS[provider].name,
  };
};

// Get Available Providers
const getAvailableProviders = async () => {
  return Object.keys(PROVIDERS).map(key => ({
    key,
    name: aiHelper.PROVIDERS[key].name,
    model: aiHelper.PROVIDERS[key].model,
    available: !!(aiHelper.PROVIDERS[key].apiKey || aiHelper.PROVIDERS[key].apikey),
  }));
};

// Check Provider Health
const checkProviderHealth = async provider => {
  if (!aiHelper.PROVIDERS[provider]) {
    throw new AppError(`Provider ${provider} not found`, 404);
  }

  try {
    const client = createClient(provider);
    const config = aiHelper.PROVIDERS[provider];

    // Simple test call with timeout
    const testPromise = client.chat.completions.create({
      model: config.model,
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5,
    });

    // Add timeout for health check
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), 10000);
    });

    await Promise.race([testPromise, timeoutPromise]);

    return {
      provider: config.name,
      status: 'healthy',
      model: config.model,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      provider: aiHelper.PROVIDERS[provider]?.name || provider,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

module.exports = {
  generateComment,
  generatePostContent,
  generateCustomComment,
  generateMessageReply,
  generateMessageTemplate,
  generateMessageReply,
  checkProviderHealth,
  getAvailableProviders,
};
