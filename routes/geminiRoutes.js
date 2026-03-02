const express = require('express');
const geminiApiController = require('../controllers/AIController/geminiController');
const { verifyToken } = require('../middlewares/verifytoken');
const { verifyExtension } = require('../middlewares/verifyExtensionRequest');
const router = express.Router();

router.use(verifyToken);
router.post('/generate/post-content/gemini', geminiApiController.generatePostContentGemini);
router.post('/generate/email-template/gemini', geminiApiController.generateEmailTemplateGemini);

router.use(verifyExtension);
router.post('/gemini/generate/comment/', geminiApiController.generateCommentGemini);
router.post('/gemini/generate/custom-comment', geminiApiController.generateCustomCommentGemini);
router.post('/gemini/generate/extn-post-content', geminiApiController.generatePostContentGeminiExtn);

router.post('/generate/use-template/gemini', geminiApiController.generateOrganizationPostContentUseTemplate);
router.post('/generate/msg-template/gemini', geminiApiController.generateTemplateGemini);

module.exports = router;
