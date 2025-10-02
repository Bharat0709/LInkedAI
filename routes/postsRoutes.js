const express = require('express');
const postController = require('../controllers/postController');
const { verifyToken } = require('../middlewares/verifytoken');
const { verifyExtension } = require('../middlewares/verifyExtensionRequest');
const router = express.Router();

router.put('/:id', verifyExtension, verifyToken, postController.upsertPostsData);
router.get('/:id', verifyToken, postController.getPostsByMemberAndOrganization);

module.exports = router;
