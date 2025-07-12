const express = require('express');
const geminiApiController = require('../controllers/AIController/geminiController');
const authController = require('../controllers/authController');
const Router = express.Router();

Router.post(
  '/generate/comment/gemini',
  authController.isUserLoggedIn,
  geminiApiController.generateCommentGemini
);

Router.post(
  '/generate/custom-comment/gemini',
  authController.isUserLoggedIn,
  geminiApiController.generateCustomCommentGemini
);

Router.post(
  '/generate/post-content/gemini',
  authController.isUserLoggedIn,
  geminiApiController.generatePostContentGemini
);

Router.post(
  '/generate/use-template/gemini',
  authController.isUserLoggedIn,
  geminiApiController.generateOrganizationPostContentUseTemplate
);

Router.post(
  '/generate/msg-template/gemini',
  authController.isUserLoggedIn,
  geminiApiController.generateTemplateGemini
);

module.exports = Router;
