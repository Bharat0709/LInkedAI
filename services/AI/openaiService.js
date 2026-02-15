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
      role: 'system',
      content: `You are a savvy LinkedIn networking expert. Your writing style is "Micro-Engagement": 
    - You avoid "AI-isms" (e.g., "This is a great reminder," "In today's fast-paced world").
    - You sound like a human typing a quick, thoughtful reply from a mobile phone.
    - You prioritize "Social Proof" and "Low-Friction" communication.`,
    },
    {
      role: 'user',
      content: `Post Content: "${postContent}"

    Task: Write a ${selectedOption} comment responding to this post.

    Execution Instructions:
    1. VOICE: Act as a peer in the industry. Use a mix of short and medium sentence lengths.
    2. HOOK: Start with a direct reaction to a specific point in the post. 
    3. THE "HUMAN" FILTER: Strictly avoid corporate cliches like "Deep dive," "Masterclass," "Kudos," or "I couldn't agree more." 
    4. FORMAT: Single paragraph. No hashtags. No quotation marks. 
    5. BREVITY: Keep it under 40 - 50  words. Every word must earn its place.
    6. TONE SPECIFICITY: If ${selectedOption} is 'Funny', use dry wit. If 'Insightful', add a small "pro-tip" or "why." If 'Congratulatory', be genuinely stoked, not formal.
    7. FINISH: Do not sign off with your name or a formal closing.`,
    },
  ];

  const generatedComment = await aiHelper.makeAPICall(provider, messages, 200);

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
      role: 'system',
      content: `You are an experienced professional with a sharp, modern communication style. 
    Your goal is to write LinkedIn comments that sound like a quick, high-value thought sent from a smartphone. 
    You avoid all "bot-like" enthusiasm and generic corporate fluff.`,
    },
    {
      role: 'user',
      content: `CONTEXT:
    Post Content: "${postContent}"
    Tone: ${customTone} - STRICTL ̏FOLLOW THIS TONE 
    Length: Exactly ${wordCount} words.

    TASK:
    Write a LinkedIn comment as a real person. 

    STRICT RULES:
    1. THE "NO-FLUFF" FILTER: Do not use words like: 'insightful', 'tremendous', 'kudos', 'valuable', 'testament', or 'delighted'. These sound like AI.
    2. DIRECTNESS: Start immediately with the core thought. No "Thanks for sharing" or "I really enjoyed reading this" openers.
    3. THE SPECIFICITY RULE: Reference one specific nuance or concept from the post content so it's clear you actually read it.
    4. SENTENCE STRUCTURE: Use fragments or punchy sentences. Avoid the "Subject + Verb + Adjective" pattern that AI defaults to.
    5. FORMAT: Single paragraph. No hashtags. No double quotes. No formal sign-offs/names.
    6. EMOJIS: Use a maximum of one relevant emoji only if the tone is 'Congratulatory' or 'Appreciative'. Otherwise, zero emojis.`,
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
      role: 'system',
      content: `You are an expert LinkedIn Content Strategist. Your writing style is:
    - High-Impact: You use "The 1-2-1 Rule" (1 strong hook, 2 supporting points, 1 closing question).
    - Readable: You use line breaks for clarity, not just bullet points.
    - Authentic: You avoid corporate "buzzword soup" and speak like a human expert.`,
    },
    {
      role: 'user',
      content: `Create a ${selectedTone} LinkedIn post about: ${postType}.

    EXECUTION STEPS:
    1. THE HOOK: Start with a "scroll-stopper" (a bold claim, a surprising stat, or a relatable pain point). Do not start with "In today's world..."
    2. THE BODY: Break the content into 3-4 punchy, digestible sections. Use simple language.
    3. THE FORMATTING: 
       - Use line breaks between every 1-2 sentences to create white space. 
       - Use plain text only (NO bolding ** or italics *).
       - If using points, use clean emojis (e.g., 🔹 or ✅) instead of standard dashes.
    4. TREND INTEGRATION: Briefly mention a current industry shift or trend to make it feel timely.
    5. THE CALL TO ACTION: End with a specific, open-ended question that is easy to answer.
    6. LINK & HASHTAGS: Include a placeholder [Insert Relevant Link Here] and 3-5 high-traffic hashtags.
    7. HUMAN FILTER: Avoid AI "tell-tale" words: 'Unlock,' 'Empower,' 'Harness,' 'Transformative,' 'Demystify.'
    
    CONSTRAINTS: 
    - Approx. length: 200-400 words (ideal for LinkedIn engagement).
    - Tone: Strictly ${selectedTone}.
    - No bold/italic markdown.`,
    },
  ];

  const generatedPostContent = await aiHelper.makeAPICall(provider, messages, 2500);

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
      role: 'system',
      content: `You are a professional networking coach. You specialize in writing "High-Response" LinkedIn Outreach.
    Your style is:
    - Direct: No fluff or long introductions.
    - Value-Oriented: Every sentence serves a purpose.
    - Low-Friction: It makes it easy for the recipient to say 'yes' or 'reply.'`,
    },
    {
      role: 'user',
      content: `PURPOSE: ${templateRequirements}
    TONE: ${selectedTone}
    WORD LIMIT: Under 150 words (brevity is key for messages).

    TASK:
    Generate a LinkedIn message template based on the purpose above.

    EXECUTION INSTRUCTIONS:
    1. THE SUBJECT LINE (if applicable): Include a punchy, relevant subject line in [brackets].
    2. THE OPENING: Start with a personalized touch (e.g., "I've been following your work on..." or "Your recent post about...").
    3. THE "WHY": Clearly state why you are reaching out in 1-2 sentences. 
    4. JOB APPLICATION SPECIFICS: If this is for a job/referral, include placeholders for [Top Skill 1], [Top Skill 2], and a clear mention that the [Resume is Attached].
    5. THE CALL TO ACTION (CTA): End with a low-pressure question (e.g., "Would you be open to a 5-minute chat?" or "Do you have any advice for someone in my position?").
    6. ANTI-BOT FILTER: Do not use "I hope this message finds you well" or "I am writing to express my interest." These are overused and ignored.
    7. FORMATTING: Use placeholders like [Name], [Company], and [Specific Project] so the user knows exactly where to customize.`,
    },
  ];

  const generatedTemplateContent = await aiHelper.makeAPICall(provider, messages, 400);
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

// Generate Message Template Service
const generateEmailTemplate = async (userType, userId, format, templateType, prompt, provider = 'chatgpt') => {
  // Process credits first
  const creditResult = await aiHelper.processCredits(userType, userId, aiHelper.CREDIT_COSTS.EMAIL_TEMPLATE, 'Email Template');

  const messages = [
    {
      role: 'system',
      content: `Generate a ${format} email template with the following specifications:

Email Format: ${format} (formal/informal/persuasive/personal)
Template Type: ${templateType} (html/text)
${prompt ? `Additional Requirements: ${prompt}` : ''}

Requirements:
- Create a professional email template suitable for ${format} communication
- Template should be concise and effective (maximum 2000 characters)
- Include relevant placeholders like {{firstName}}, {{lastName}}, {{companyName}}, {{position}}, etc.
- ${templateType === 'html' ? 'Use proper HTML structure with inline CSS styling for email compatibility' : 'Use clean, well-formatted plain text'}
- Ensure the tone matches the ${format} style requested
- Include appropriate greeting, body content, and professional closing
- Make it versatile for various business communication needs
- If HTML format, ensure mobile-responsive design with proper email client compatibility

${templateType === 'html' ? 'Return valid HTML email template with inline CSS.' : 'Return clean plain text email template.'}
Do not include explanations or additional text - only the template content.`,
    },
  ];

  const generatedTemplateContent = await aiHelper.makeAPICall(provider, messages, 400);

  console.log(generatedTemplateContent);
  await logActivity(userId, 'credits_used', {
    creditsUsed: aiHelper.CREDIT_COSTS.EMAIL_TEMPLATE,
    service: 'email_template',
    provider: aiHelper.PROVIDERS[provider].name,
  });

  return {
    generatedEmailContent: generatedTemplateContent.trim(),
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
      role: 'system',
      content: `You are a high-level executive assistant for ${userName}. 
    Your goal is to maintain ${userName}'s professional reputation by writing replies that are:
    - Contextual: They directly address the last point made in the conversation.
    - Human: They sound like a busy professional, not a formal chatbot.
    - Minimalist: No unnecessary politeness or "fluff" sentences.`,
    },
    {
      role: 'user',
      content: `CONTEXT:
    User Name: ${userName}
    Recent Conversation History: 
    """
    ${formattedMessages}
    """

    TASK:
    Write a reply on behalf of ${userName}. Decide word limit by yourself based on the conversation of the users. 

    DECISION LOGIC:
    1. IF THE LAST MESSAGE WAS FROM A THIRD PARTY: Pick up on their last specific question or statement. Acknowledge it and provide a logical next step or answer.
    2. IF THE ONLY MESSAGES ARE FROM ${userName} (OR NO HISTORY): Generate a "Cold Outreach" starter that is relevant to a professional LinkedIn setting (e.g., "Thanks for connecting, [Name]. Looking forward to following your work.")

    STRICT GUIDELINES:
    - NO BOT OPENERS: Avoid "I hope you are doing well" or "Thank you for your message."
    - TONE: Professional, peer-to-peer, and decisive.
    - FORMAT: Plain text only. No hashtags. No quotes.
    - SIGN-OFF: Do not include a formal sign-off unless it's a simple "Best, ${userName}" or "Thanks, ${userName}".`,
    },
  ];

  const generatedReply = await aiHelper.makeAPICall(provider, messages, 200);
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
  generateEmailTemplate,
  checkProviderHealth,
  getAvailableProviders,
};
