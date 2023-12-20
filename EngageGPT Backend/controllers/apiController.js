const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const dotenv = require("dotenv");
dotenv.config();
const axios = require("axios");
const { promisify } = require("util");
const apiKey = process.env.API_KEY_CHATGPT;
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.API_KEY_GEMINI);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const generationConfig = {
  temperature: 0.45,
  topK: 32,
  topP: 0.65,
  maxOutputTokens: 1500,
};

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
    const user = req.user;

    // Check if the user has enough credits
    if (user.credits < 5) {
      return res.status(403).json({ error: "Insufficient credits" });
    }

    const generatedComment = await getComment(postContent, selectedOption);
    user.credits -= 5;
    await User.findByIdAndUpdate(user._id, { credits: user.credits });

    res.json({
      generatedComment: generatedComment,
      remainingCredits: user.credits,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

async function getComment(postContent, selectedOption) {
  const parts = [
    {
      text: `Generate a ${selectedOption} comment for a linkedIn Post with the following post content:\n\n${postContent} the comment should have some emojis if possible and should be based on the whole post content`,
    },
    { text: "\n" },
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  });

  return result.response.text();
}

exports.generatePostContentGemini = catchAsync(async (req, res, next) => {
  try {
    const { postType, selectedTone } = req.body;
    console.log(postType, selectedTone);

    const user = req.user;

    // Check if the user has enough credits
    if (user.credits < 10) {
      return res.status(403).json({ error: "Insufficient credits" });
    }

    const generatedPostContent = await getPostContent(postType, selectedTone);
    // Deduct 10 credits from the
    user.credits -= 10;

    // Update user details in the database (replace this with your actual logic)
    await User.findByIdAndUpdate(user._id, { credits: user.credits });
    res.json({
      generatedPostContent: generatedPostContent,
      remainingCredits: user.credits,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

async function getPostContent(postType, selectedTone) {
  const parts = [
    {
      text: `Generate a ${selectedTone} LinkedIn post with the following specifications:

      Post Topic is about ${postType}

      Requirements:
      - Include emojis to add a touch of personality.
      - Incorporate relevant hashtags for increased visibility.
      - Start the post with a compelling hook line to engage the audience.
      - Give the content in points and understand what kind of content will suite the audience the best as per the post content requirements
      - Should have one link attached that is related to post content helpful for the audience 
      `,
    },
    { text: "\n" },
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  });

  return result.response.text();
}

exports.generateTemplateGemini = catchAsync(async (req, res, next) => {
  try {
    const { templateRequirements, selectedTone } = req.body;
    // Use the API key from the environment variable
    const user = req.user;

    // Check if the user has enough credits
    if (user.credits < 10) {
      return res.status(403).json({ error: "Insufficient credits" });
    }
    const generatedTemplateContent = await getTemplate(
      templateRequirements,
      selectedTone
    );
    user.credits -= 10;

    await User.findByIdAndUpdate(user._id, { credits: user.credits });
    // Send the generated template back to the frontend
    res.status(200).json({
      generatedTemplateContent: generatedTemplateContent,
      remainingCredits: user.credits,
    });
  } catch (error) {
    // Handle errors appropriately
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
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
    { text: "\n" },
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  });

  return result.response.text();
}

exports.generatePostContentChatGpt = catchAsync(async (req, res, next) => {
  try {
    const { postType, selectedTone } = req.body;
    const user = req.user;

    // Check if the user has enough credits
    if (user.credits < 5) {
      return res.status(403).json({ error: "Insufficient credits" });
    }

    // Deduct 10 credits from the
    user.credits -= 5;

    // Update user details in the database (replace this with your actual logic)
    await User.findByIdAndUpdate(user._id, { credits: user.credits });

    const chatGPTResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: `Generate a ${selectedTone} LinkedIn post with the following specifications:

            Post Topic is about ${postType}

            Requirements:
            - Include emojis to add a touch of personality.
            - Incorporate relevant hashtags for increased visibility.
            - Start the post with a compelling hook line to engage the audience.
            - Give the content in points and understand what kind of content will suite the audience the best as per the post content requirements
            - Should have one link attached that is related to post content helpful for the audience
            `,
          },
        ],
        max_tokens: 300,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.status(200).json({
      generatedPostContent: chatGPTResponse.data.choices[0].message.content,
      remainingCredits: user.credits,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

exports.generateTemplateChatGpT = catchAsync(async (req, res, next) => {
  try {
    const { templateRequirements, selectedTone } = req.body;
    const user = req.user;

    // Check if the user has enough credits
    if (user.credits < 10) {
      return res.status(403).json({ error: "Insufficient credits" });
    }

    const chatGPTResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
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
          "Content-Type": "application/json",
        },
      }
    );
    // Deduct 10 credits from the
    user.credits -= 10;

    // Update user details in the database (replace this with your actual logic)
    await User.findByIdAndUpdate(user._id, { credits: user.credits });
    res.status(200).json({
      generatedTemplateContent: chatGPTResponse.data.choices[0].message.content,
      remainingCredits: user.credits,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

exports.generateCommentChatGpt = catchAsync(async (req, res, next) => {
  try {
    const { postContent, selectedOption } = req.body;
    const user = req.user;

    // Check if the user has enough credits
    if (user.credits < 5) {
      return res.status(403).json({ error: "Insufficient credits" });
    }

    const chatGPTResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: `Generate a ${selectedOption} comment for a linkedIn Post with the following post content:\n\n${postContent} the comment should have some emojis if possible and should be based on the whole post content`,
          },
        ],
        max_tokens: 60,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    // Deduct 5 credits from the
    user.credits -= 5;

    // Update user details in the database (replace this with your actual logic)
    await User.findByIdAndUpdate(user._id, { credits: user.credits });
    res.status(200).json({
      generatedComment: chatGPTResponse.data.choices[0].message.content,
      remainingCredits: user.credits,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
