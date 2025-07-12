const express = require('express');
const openaiController = require('../controllers/AIController/openaiController');
const authController = require('../controllers/authController');
const Router = express.Router();

Router.post(
  '/generate/comment',
  authController.isUserLoggedIn,
  openaiController.generateComment
);

Router.post(
  '/generate/custom-comment',
  authController.isUserLoggedIn,
  openaiController.generateCustomComment
);

Router.post(
  '/generate/post-content',
  authController.isUserLoggedIn,
  openaiController.generatePostContent
);

Router.post(
  '/generate/msg-template',
  authController.isUserLoggedIn,
  openaiController.generateMessageTemplate
);

Router.post(
  '/generate/msg-reply',
  authController.isUserLoggedIn,
  openaiController.generateMessageReply
);

Router.get('/providers', openaiController.getProviders);

Router.get('/providers/:provider/health', openaiController.checkProviderHealth);

module.exports = Router;
