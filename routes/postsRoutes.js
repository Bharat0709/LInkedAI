const express = require('express');
const postController = require('../controllers/postController');
const authController = require('../controllers/authController');
const Router = express.Router();

Router.put(
  '/:id',
  authController.isUserLoggedIn,
  postController.upsertPostsData
);

Router.get(
  '/:id',
  authController.isUserLoggedIn,
  postController.getPostsByMemberAndOrganization
);
module.exports = Router;
