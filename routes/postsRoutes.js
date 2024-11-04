const express = require('express');
const postController = require('../controllers/postController');
const authController = require('../controllers/authController');
const Router = express.Router();

Router.post('/collect', authController.isLoggedIn, postController.createPost);
module.exports = Router;
