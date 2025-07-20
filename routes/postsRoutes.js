const express = require('express');
const postController = require('../controllers/postController');
const { verifyToken } = require('../middlewares/verifytoken');
const { verifyExtension } = require('../middlewares/verifyExtensionRequest');
const Router = express.Router();

Router.put('/:id', verifyExtension, verifyToken, postController.upsertPostsData);
Router.get('/:id', verifyToken, postController.getPostsByMemberAndOrganization);

module.exports = Router;
