const express = require('express');
const openaiController = require('../controllers/AIController/openaiController');
const geminiApiController = require('../controllers/AIController/geminiController');
const { verifyToken } = require('../middlewares/verifytoken');
const { verifyExtension } = require('../middlewares/verifyExtensionRequest');
const router = express.Router();

router.get('/providers', openaiController.getProviders);
router.get('/providers/:provider/health', openaiController.checkProviderHealth);

router.use(verifyToken);
router.post('/gemini/generate/post-content', geminiApiController.generatePostContentGemini);
router.post('/gemini/generate/email-template', geminiApiController.generateEmailTemplateGemini);
router.post('/openai/generate/post-content', openaiController.generatePostContent);
router.post('/openai/generate/email-template', openaiController.generateEmailTemplate);

router.use(verifyExtension);
router.post('/gemini/generate/comment', geminiApiController.generateCommentGemini);
router.post('/gemini/generate/custom-comment', geminiApiController.generateCustomCommentGemini);
router.post('/gemini/generate/extn-post-content', geminiApiController.generatePostContentGeminiExtn);
router.post('/gemini/generate/use-template', geminiApiController.generateOrganizationPostContentUseTemplate);
router.post('/gemini/generate/msg-template', geminiApiController.generateTemplateGemini);

router.post('/openai/generate/comment', openaiController.generateComment);
router.post('/openai/generate/custom-comment', openaiController.generateCustomComment);
router.post('/openai/generate/msg-reply', openaiController.generateMessageReply);
router.post('/openai/generate/msg-template', openaiController.generateMessageTemplate);

module.exports = router;
