// services/geminiService.js
const dotenv = require('dotenv');
dotenv.config();
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.API_KEY_GEMINI);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL });

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

const generateComment = async (postContent, selectedOption) => {
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
};

const generateCustomComment = async (postContent, customTone, wordCount) => {
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
};

const generatePostContent = async (postType, selectedTone) => {
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
};

const generateOrganizationPostContentWithPersona = async (postType, selectedTone, language, persona) => {
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
};

const generateOrganizationPostContentWithTemplate = async (postType, selectedTone, language, template) => {
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
};

const generateTemplate = async (templateRequirements, selectedTone) => {
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

  const generationConfig = {
    temperature: 0.45,
    topK: 32,
    topP: 0.65,
    maxOutputTokens: 800,
  };

  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
    generationConfig,
    safetySettings,
  });

  return result.response.text();
};

module.exports = {
  generateComment,
  generateCustomComment,
  generatePostContent,
  generateOrganizationPostContentWithPersona,
  generateOrganizationPostContentWithTemplate,
  generateTemplate,
};
