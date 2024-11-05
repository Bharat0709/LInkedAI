const express = require('express');
const postController = require('../controllers/postController');
const authController = require('../controllers/authController');
const Router = express.Router();

Router.post('/analyze', authController.isLoggedIn, postController.analyzePost);
module.exports = Router;
