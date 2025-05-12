const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const dotenv = require('dotenv');
dotenv.config();
const axios = require('axios');
const apiKey = process.env.API_KEY_CHATGPT;
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require('@google/generative-ai');
const Member = require('../models/members');
const Organization = require('../models/organization');
const genAI = new GoogleGenerativeAI(process.env.API_KEY_GEMINI);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

exports.generateCommentGemini = catchAsync(async (req, res, next) => {
  try {
    const { postContent, selectedOption } = req.body;
    const user = req.member;
    // Check if the user has enough credits
    if (user.credits < 5) {
      return res.status(403).json({ error: 'Insufficient credits' });
    }

    const generatedComment = await getComment(postContent, selectedOption);
    user.credits -= 5;
    user.totalCreditsUsed += 5;
    await Member.findByIdAndUpdate(user._id, {
      credits: user.credits,
      totalCreditsUsed: user.totalCreditsUsed,
    });

    res.json({
      generatedComment: generatedComment,
      remainingCredits: user.credits,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

exports.generateCustomCommentGemini = catchAsync(async (req, res, next) => {
  try {
    const { postContent, customTone, wordCount } = req.body;
    const user = req.member;
    if (user.credits < 5) {
      return res.status(403).json({ error: 'Insufficient credits' });
    }
    const generatedComment = await getCustomComment(
      postContent,
      customTone,
      wordCount
    );
    user.credits -= 5;
    user.totalCreditsUsed += 5;
    await Member.findByIdAndUpdate(user._id, {
      credits: user.credits,
      totalCreditsUsed: user.totalCreditsUsed,
    });
    res.json({
      generatedComment: generatedComment,
      remainingCredits: user.credits,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

async function getCustomComment(postContent, customTone, wordCount) {
  const parts = [
    {
      text: `As a linkedIn user in India on behalf of me help me write a ${customTone} comment for a linkedIn Post with the following post content:\n\n${postContent} in ${wordCount} words
      Requirements:
      - The tone of the comment should strictly be in ${customTone} tone
      - The comment should be relevant to the whole post content
      - Give response as if a real user have written the comment
      - You can use emojis as well if its a congratulatory comment
      - Do not repeat the words wriiten in the post. Give a comment as if a linkedIn user is replying for the given post.
      - Do not include double quotes in response
      - Do not include hashtags response 
      - Give enagaging comment & complete the comment within the word limit 
      - The comment should not seem to be written by AI`,
    },
    { text: '\n' },
  ];
  const generationConfig = {
    temperature: 0.45,
    topK: 32,
    topP: 0.65,
    maxOutputTokens: 120,
  };
  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
    generationConfig,
    safetySettings,
  });

  return result.response.text();
}

async function getComment(postContent, selectedOption) {
  const parts = [
    {
      text: `As a linkedIn user in India on behalf of me help me write a ${selectedOption} tone.  comment for a linkedIn Post with the following post content:\n\n${postContent} 
      Requirements:
      - The comment should be strictly in ${selectedOption} tone only.
      - The comment should be relevant to the whole post content
      - Give response as if a real user have written the comment
      - Do not repeat the words wriiten in the post. Give a comment as if a linkedIn user is replying for the given post.
      - You can use emojis as well if its a congratulatory comment
      - Give result in a single paragraph and not greater than 30 words  
      - Do not include double quotes in response
      - Do not include hashtags in response 
      - Give a short and engaging comment 
      - Comment should not seem to be written by AI`,
    },
    { text: '\n' },
  ];
  const generationConfig = {
    temperature: 0.45,
    topK: 32,
    topP: 0.65,
    maxOutputTokens: 120,
  };
  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
    generationConfig,
    safetySettings,
  });

  return result.response.text();
}

exports.generateCommentChatGpt = catchAsync(async (req, res, next) => {
  try {
    const { postContent, selectedOption } = req.body;
    const user = req.member;
    if (user.credits < 5) {
      return res.status(403).json({ error: 'Insufficient credits' });
    }
    user.credits -= 5;
    user.totalCreditsUsed += 5;
    await Member.findByIdAndUpdate(user._id, {
      credits: user.credits,
    });
    await Member.findByIdAndUpdate(user._id, {
      totalCreditsUsed: user.totalCreditsUsed,
    });
    const chatGPTResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo-0125',
        messages: [
          {
            role: 'user',
            content: `As a linkedIn user on behalf of me help me writing a comment in ${selectedOption} tone for a linkedIn Post with the following post content:\n\n${postContent} 
            Requirements: 
            - The comment should be strictly in ${selectedOption} tone only.
            - The comment should be relevant to the whole post content
            - Give response as if a real user have written the comment
            - You can use emojis as well if its a congratulatory comment
            - Do not repeat the exact words wriiten in the post
            - Give result in a single paragraph and not greater than 30 words  
            - Do not include double quotes in response
            - Do not include hashtags in response 
            - Give a short and engaging comment 
            - Comment should not seem to be written by AI`,
          },
        ],
        max_tokens: 120,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    res.status(200).json({
      generatedComment: chatGPTResponse.data.choices[0].message.content,
      remainingCredits: user.credits,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

exports.generateCustomCommentChatGpt = catchAsync(async (req, res, next) => {
  try {
    const { postContent, customTone, wordCount } = req.body;
    const user = req.member;
    // Check if the user has enough credits
    if (user.credits < 5) {
      return res.status(403).json({ error: 'Insufficient credits' });
    }
    user.credits -= 5;
    user.totalCreditsUsed += 5;
    await Member.findByIdAndUpdate(user._id, {
      credits: user.credits,
    });
    await Member.findByIdAndUpdate(user._id, {
      totalCreditsUsed: user.totalCreditsUsed,
    });
    const chatGPTResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: `As a linkedIn user from India on behalf of me help me write a comment for a linkedIn Post in the ${customTone} tone with the following post content:\n\n${postContent} in ${wordCount} words
            Requirements:
            - You can use emojis as well if its a congratulatory comment
            - The comment should strictly be in ${customTone} only
            - Give response as if a real user have written the comment
            - The comment should be relevant to the whole post content
            - Do not repeat the exact words wriiten in the post.
            - Do not include double quotes in response
            - Do not include hashtags in response 
            - Give enagaging comment & complete the comment within the word limit 
            - The comment should not seem to be written by AI`,
          },
        ],
        max_tokens: 200,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    // Deduct 5 credits from the
    res.status(200).json({
      generatedComment: chatGPTResponse.data.choices[0].message.content,
      remainingCredits: user.credits,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

exports.generatePostContentGemini = catchAsync(async (req, res, next) => {
  try {
    const { postType, selectedTone } = req.body;

    const user = req.member;

    if (user.credits < 10) {
      return res.status(403).json({ error: 'Insufficient credits' });
    }

    const generatedPostContent = await getPostContentMember(
      postType,
      selectedTone
    );
    // Deduct 10 credits from the
    user.credits -= 10;
    user.totalCreditsUsed += 10;
    await Member.findByIdAndUpdate(user._id, {
      credits: user.credits,
    });
    await Member.findByIdAndUpdate(user._id, {
      totalCreditsUsed: user.totalCreditsUsed,
    });
    res.json({
      generatedPostContent: generatedPostContent,
      remainingCredits: user.credits,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

exports.generateOrganizationPostContentUsePersona = catchAsync(
  async (req, res, next) => {
    try {
      const { postType, language, persona, selectedTone } = req.body;

      const user = req.organization;

      if (user.credits < 10) {
        return next(new AppError('Insufficient Credits', 400));
      }

      const generatedPostContent = await getPostContentPersonaOrg(
        postType,
        selectedTone,
        language,
        persona
      );
      user.credits -= 10;
      user.totalCreditsUsed += 10;
      await Organization.findByIdAndUpdate(user._id, {
        credits: user.credits,
      });
      await Organization.findByIdAndUpdate(user._id, {
        totalCreditsUsed: user.totalCreditsUsed,
      });
      res.json({
        generatedPostContent: generatedPostContent,
        remainingCredits: user.credits,
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

async function getPostContentPersonaOrg(
  postType,
  selectedTone,
  language,
  persona
) {
  const parts = [
    {
      text: ` As a linkedIn user i want you to make a ${selectedTone} LinkedIn post in ${language} for me with the following specifications:
      - Do not include ** or * before, after or in between the words in the response

      Post Topic is about ${postType} and u follow this persona of the user -
      Persona - ${persona} - 
      use this above only if this has some content in it and dont follow below instructions,  if not follow the below requirements

      Requirements:
      - Include emojis to add a touch of personality.
      - Incorporate relevant hashtags for increased visibility.
      - Start the post with a compelling hook line to engage the audience.
      - Give the content in points and understand what kind of content will suite the audience the best as per the post content requirements
      - Should have one link attached that is related to post content helpful for the audience if any
      - Prompt followers to share their thoughts or experiences related to the post.
      - Ensure the post fits within LinkedIn's character limit for optimal engagement
      - Leverage current events or industry trends to make the post timely and relevant.
      - Use simple and easy to undestand words in the post
      - The post should not seem to be written by AI
      `,
    },
    { text: '\n' },
  ];
  const generationConfig = {
    temperature: 0.45,
    topK: 32,
    topP: 0.65,
    maxOutputTokens: 1200,
  };

  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
    generationConfig,
    safetySettings,
  });
  return result.response.text();
}

exports.generateOrganizationPostContentUseTemplate = catchAsync(
  async (req, res, next) => {
    try {
      const { postType, language, template, selectedTone } = req.body;

      const user = req.organization;

      if (user.credits < 10) {
        return next(new AppError('Insufficient Credits', 400));
      }

      const generatedPostContent = await getPostContentTemplateOrg(
        postType,
        selectedTone,
        language,
        template
      );
      user.credits -= 10;
      user.totalCreditsUsed += 10;
      await Organization.findByIdAndUpdate(user._id, {
        credits: user.credits,
      });
      await Organization.findByIdAndUpdate(user._id, {
        totalCreditsUsed: user.totalCreditsUsed,
      });
      res.json({
        generatedPostContent: generatedPostContent,
        remainingCredits: user.credits,
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

async function getPostContentTemplateOrg(
  postType,
  selectedTone,
  language,
  template
) {
  const parts = [
    {
      text: ` As a linkedIn user i want you to make a ${selectedTone} LinkedIn post in ${language} for me with the following specifications:

      - Do not include ** or * before, after or in between the words in the response

      Post Topic is about ${postType} and u follow this template given by the user.
      Template - ${template} -
      Use this above only if this has some content in it and dont follow below instructions,  if not follow the below requirements

      Requirements:
      - Include emojis to add a touch of personality.
      - Do not include ** or * before, after or in between the words in the response
      - Incorporate relevant hashtags for increased visibility.
      - Start the post with a compelling hook line to engage the audience.
      - Give the content in points and understand what kind of content will suite the audience the best as per the post content requirements
      - Should have one link attached that is related to post content helpful for the audience if any
      - Prompt followers to share their thoughts or experiences related to the post.
      - Ensure the post fits within LinkedIn's character limit for optimal engagement
      - Leverage current events or industry trends to make the post timely and relevant.
      - Use simple and easy to undestand words in the post
      - The post should not seem to be written by AI
      `,
    },
    { text: '\n' },
  ];
  const generationConfig = {
    temperature: 0.45,
    topK: 32,
    topP: 0.65,
    maxOutputTokens: 1200,
  };

  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
    generationConfig,
    safetySettings,
  });
  return result.response.text();
}

async function getPostContentMember(postType, selectedTone) {
  const parts = [
    {
      text: ` As a linkedIn user i want you to make a ${selectedTone} LinkedIn post in for me with the following specifications:

      Post Topic is about ${postType}

      Requirements:
      - Include emojis to add a touch of personality.
      - Do not include ** or * before, after or in between the words in the response
      - Incorporate relevant hashtags for increased visibility.
      - Start the post with a compelling hook line to engage the audience.
      - Give the content in points and understand what kind of content will suite the audience the best as per the post content requirements
      - Should have one link attached that is related to post content helpful for the audience if any
      - Prompt followers to share their thoughts or experiences related to the post.
      - Ensure the post fits within LinkedIn's character limit for optimal engagement
      - Leverage current events or industry trends to make the post timely and relevant.
      - Use simple and easy to undestand words in the post
      - The post should not seem to be written by AI
      `,
    },
    { text: '\n' },
  ];
  const generationConfig = {
    temperature: 0.45,
    topK: 32,
    topP: 0.65,
    maxOutputTokens: 1200,
  };

  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
    generationConfig,
    safetySettings,
  });

  return result.response.text();
}

exports.generateTemplateGemini = catchAsync(async (req, res, next) => {
  try {
    const { templateRequirements, selectedTone } = req.body;
    // Use the API key from the environment variable
    const user = req.member;

    // Check if the user has enough credits
    if (user.credits < 10) {
      return res.status(403).json({ error: 'Insufficient credits' });
    }
    const generatedTemplateContent = await getTemplate(
      templateRequirements,
      selectedTone
    );
    user.credits -= 10;
    user.totalCreditsUsed += 10;
    await Member.findByIdAndUpdate(user._id, {
      credits: user.credits,
    });
    await Member.findByIdAndUpdate(user._id, {
      totalCreditsUsed: user.totalCreditsUsed,
    });

    res.status(200).json({
      generatedTemplateContent: generatedTemplateContent,
      remainingCredits: user.credits,
    });
  } catch (error) {
    // Handle errors appropriately
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

async function getTemplate(templateRequirements, selectedTone) {
  const parts = [
    {
      text: `Generate a ${selectedTone} message template for linkedin with the following purpose:

      Template is about ${templateRequirements}

      Requirements:
      - Template should be short and to the point
      - Should be completed in 200 words 
      - Message Template should be professional.
      - If the template is about applying for a job then attach a resume and skills in the message and the message should be professional
      `,
    },
    { text: '\n' },
  ];

  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
    generationConfig,
    safetySettings,
  });

  return result.response.text();
}

exports.generatePostContentChatGpt = catchAsync(async (req, res, next) => {
  try {
    const { postType, selectedTone } = req.body;
    const user = req.member;

    // Check if the user has enough credits
    if (user.credits < 10) {
      return res.status(403).json({ error: 'Insufficient credits' });
    }

    // Deduct 10 credits from the
    user.credits -= 10;
    user.totalCreditsUsed += 10;
    await Member.findByIdAndUpdate(user._id, {
      credits: user.credits,
    });
    await Member.findByIdAndUpdate(user._id, {
      totalCreditsUsed: user.totalCreditsUsed,
    });

    const chatGPTResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
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
            - Use simple and easy to undestand words in the post\
            - The post should not seem to be written by AI
            - Complete the post within approx 900 words
            `,
          },
        ],
        max_tokens: 900,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    res.status(200).json({
      generatedPostContent: chatGPTResponse.data.choices[0].message.content,
      remainingCredits: user.credits,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

exports.generateTemplateChatGpT = catchAsync(async (req, res, next) => {
  try {
    const { templateRequirements, selectedTone } = req.body;
    const user = req.member;
    // Check if the user has enough credits
    if (user.credits < 10) {
      return res.status(403).json({ error: 'Insufficient credits' });
    }

    const chatGPTResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: `Generate a ${selectedTone} message template for linkedin with the following purpose:

            Template is about ${templateRequirements}

            Requirements:
            - Template should be short and to the point
            - Should be completed in 200 words
            - Message Template should be professional.
            - If template is about applying for job then atttach resume and skills in the messageans message should be professional
            `,
          },
        ],
        max_tokens: 300,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    // Deduct 10 credits from the
    user.credits -= 10;
    user.totalCreditsUsed += 10;
    await Member.findByIdAndUpdate(user._id, {
      credits: user.credits,
    });
    await Member.findByIdAndUpdate(user._id, {
      totalCreditsUsed: user.totalCreditsUsed,
    });
    res.status(200).json({
      generatedTemplateContent: chatGPTResponse.data.choices[0].message.content,
      remainingCredits: user.credits,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

exports.generateReplyChatGpT = catchAsync(async (req, res, next) => {
  try {
    const { formattedMessages, userName } = req.body;
    const user = req.member;

    // Check if the user has enough credits
    if (user.credits < 10) {
      return res.status(403).json({ error: 'Insufficient credits' });
    }

    const chatGPTResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: `My name is ${userName} and on behalf of me Generate a formal reply to these messages from  linkedin with the following last 5 conversation:
           

           ${formattedMessages}

           If there is no message from the other side except for ${userName} that is me then send a default one to start a conversation.
            Requirements:
            - Reply should be short and to the point
            - Should be completed in 50 words
            - Reply should be professional.
            `,
          },
        ],
        max_tokens: 100,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    // Deduct 10 credits from the
    user.credits -= 10;
    user.totalCreditsUsed += 10;
    await Member.findByIdAndUpdate(user._id, {
      credits: user.credits,
    });
    await Member.findByIdAndUpdate(user._id, {
      totalCreditsUsed: user.totalCreditsUsed,
    });
    res.status(200).json({
      generatedReply: chatGPTResponse.data.choices[0].message.content,
      remainingCredits: user.credits,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

exports.detectTopicGemini = async (postContent) => {
  try {
    const detectedTopic = await detectTopic(postContent);
    return detectedTopic;
  } catch (error) {
    console.log(error);
  }
};

async function detectTopic(postContent) {
  const parts = [
    {
      text: `Analyze the following LinkedIn post content and provide a concise 3-4 word summary that describes the primary nature of the post. 
      
      - If the post content is very short (3 - 4 words or less) and it is diificult detect the nature of the post return the result that Short Post
      - If you think this post based on its content is a spam post then in that case (but you should be 90% sure that this is a potential spam) post then only "Potential Spam"
      - If you think this post based on its content is type of a promotional Post but you should be 90% sure that this is a promotional post then only include "Promotional Post"
      - If you think this post based on its content is type AI generated but you should be 90% sure that this is a AI Generated post then only include "AI Generated"
      - Otherwise, summarize the main topic (e.g., "Job Search Tips", "Networking Opportunity")
      
      Post Content:
      
      "${postContent}"
      
      Respond with a single phrase of 3-4 words that best captures what the post is about.`,
    },

    { text: '\n' },
  ];

  const generationConfig = {
    temperature: 0.45,
    topK: 32,
    topP: 0.65,
    maxOutputTokens: 120,
  };

  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
    generationConfig,
    safetySettings,
  });
  return result.response.text();
}

exports.determinePersona = async (writingPreferences, samplePosts) => {
  const parts = [
    {
      text: `
  Analyze the following writing preferences and the provided array of sample posts to derive the persona of the writer. Use the information provided to construct a detailed and accurate description:
  
  Writing Preferences:
  ${writingPreferences}
  
  Array of Sample Posts:
  [
    ${samplePosts
      .map((post, index) => `Post ${index + 1}: "${post}"`)
      .join(',\n')}
  ]
  
  Instructions:
  1. Analyze each post to identify:
     - Dominant tone (e.g., formal, conversational, motivational).
     - Style of writing (concise, elaborate, technical, creative, etc.).
     - Intent behind the post (informing, persuading, entertaining, or connecting with the audience).
     - Target audience inferred from the content, language, and themes.
  2. Summarize the persona of the writer based on common patterns and traits observed across all posts.
  3. Highlight strengths of the writer’s approach (e.g., clarity, engagement, creativity) and suggest areas for improvement.
  4. Ensure the output is concise yet comprehensive and limited to 200 words.

  Output Format: (Don't use double quotes OR ** in the ouput)
  - Tone: [Description]
  - Style: [Description]
  - Intent: [Description]
  - Target Audience: [Description]
  - Persona Summary: [Comprehensive and insightful summary based on the above points]
  `,
    },
    { text: '\n' },
  ];

  const generationConfig = {
    temperature: 0.45,
    topK: 32,
    topP: 0.65,
    maxOutputTokens: 120,
  };

  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
    generationConfig,
    safetySettings,
  });

  return result.response.text();
};
