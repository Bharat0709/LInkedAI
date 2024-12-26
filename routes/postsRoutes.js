const express = require('express');
const postController = require('../controllers/postController');
const authController = require('../controllers/authController');
const Router = express.Router();

Router.post(
  '/analyze',
  authController.isUserLoggedIn,
  postController.analyzePost
);
module.exports = Router;
