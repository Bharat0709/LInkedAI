const express = require('express');
const apiController = require('../controllers/apiController');
const authController = require('../controllers/authController');
const Router = express.Router();

Router.post(
  '/generategeminicomment',
  authController.isLoggedIn,
  apiController.generateCommentGemini
);
Router.post(
  '/generatecustomgeminicomment',
  authController.isLoggedIn,
  apiController.generateCustomCommentGemini
);
Router.post(
  '/generategeminipostcontent',
  authController.isLoggedIn,
  apiController.generatePostContentGemini
);
Router.post(
  '/generategeminitemplate',
  authController.isLoggedIn,
  apiController.generateTemplateGemini
);
Router.post(
  '/generatechatgptcomment',
  authController.isLoggedIn,
  apiController.generateCommentChatGpt
);
Router.post(
  '/generatecustomchatgptcomment',
  authController.isLoggedIn,
  apiController.generateCustomCommentChatGpt
);
Router.post(
  '/generatechatgptpostcontent',
  authController.isLoggedIn,
  apiController.generatePostContentChatGpt
);
Router.post(
  '/generatechatgpttemplate',
  authController.isLoggedIn,
  apiController.generateTemplateChatGpT
);
Router.post(
  '/generatechatgptreply',
  authController.isLoggedIn,
  apiController.generateReplyChatGpT
);

module.exports = Router;
