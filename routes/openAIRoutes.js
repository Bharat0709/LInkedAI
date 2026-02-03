const express = require('express');
const openaiController = require('../controllers/AIController/openaiController');
const { verifyToken } = require('../middlewares/verifytoken');
const { verifyExtension } = require('../middlewares/verifyExtensionRequest');
const router = express.Router();

router.get('/providers', openaiController.getProviders);
router.get('/providers/:provider/health', openaiController.checkProviderHealth);

router.use(verifyToken);
router.post('/generate/post-content', openaiController.generatePostContent);

router.use(verifyExtension);
router.post('/generate/comment', openaiController.generateComment);
router.post('/generate/custom-comment', openaiController.generateCustomComment);
router.post('/generate/msg-reply', openaiController.generateMessageReply);
router.post('/generate/msg-template', openaiController.generateMessageTemplate);

module.exports = router;
