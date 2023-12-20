const express = require("express");
const apiController = require("../controllers/apiController");
const authController = require("../controllers/authController");
const Router = express.Router();

Router.post(
  "/generategeminicomment",
  authController.isLoggedIn,
  apiController.generateCommentGemini
);
Router.post(
  "/generategeminipostcontent",
  authController.isLoggedIn,
  apiController.generatePostContentGemini
);
Router.post(
  "/generategeminitemplate",
  authController.isLoggedIn,
  apiController.generateTemplateGemini
);
Router.post(
  "/generatechatgptcomment",
  authController.isLoggedIn,
  apiController.generateCommentChatGpt
);
Router.post(
  "/generatechatgptpostcontent",
  authController.isLoggedIn,
  apiController.generatePostContentChatGpt
);
Router.post(
  "/generatechatgpttemplate",
  authController.isLoggedIn,
  apiController.generateTemplateChatGpT
);

module.exports = Router;
