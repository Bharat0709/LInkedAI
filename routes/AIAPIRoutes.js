const express = require('express');
const apiController = require('../controllers/apiController');
const authController = require('../controllers/authController');
const Router = express.Router();

Router.post(
  '/generategeminicomment',
  authController.isUserLoggedIn,
  apiController.generateCommentGemini
);
Router.post(
  '/generatecustomgeminicomment',
  authController.isUserLoggedIn,
  apiController.generateCustomCommentGemini
);
Router.post(
  '/generategeminipostcontent',
  authController.isUserLoggedIn,
  apiController.generatePostContentGemini
);
Router.post(
  '/generategeminitemplate',
  authController.isUserLoggedIn,
  apiController.generateTemplateGemini
);
Router.post(
  '/generatechatgptcomment',
  authController.isUserLoggedIn,
  apiController.generateCommentChatGpt
);
Router.post(
  '/generatecustomchatgptcomment',
  authController.isUserLoggedIn,
  apiController.generateCustomCommentChatGpt
);
Router.post(
  '/generatechatgptpostcontent',
  authController.isUserLoggedIn,
  apiController.generatePostContentChatGpt
);
Router.post(
  '/generatechatgpttemplate',
  authController.isUserLoggedIn,
  apiController.generateTemplateChatGpT
);
Router.post(
  '/generatechatgptreply',
  authController.isUserLoggedIn,
  apiController.generateReplyChatGpT
);

module.exports = Router;
