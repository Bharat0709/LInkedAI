const express = require('express');
const geminiApiController = require('../controllers/AIController/geminiController');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/verifytoken');
const { verifyExtension } = require('../middlewares/verifyExtensionRequest');
const router = express.Router();

router.use(verifyToken);
router.post('/generate/post-content/gemini', geminiApiController.generatePostContentGemini);

router.use(verifyExtension);
router.post('/generate/comment/gemini', geminiApiController.generateCommentGemini);
router.post('/generate/custom-comment/gemini', geminiApiController.generateCustomCommentGemini);
router.post('/generate/use-template/gemini', geminiApiController.generateOrganizationPostContentUseTemplate);
router.post('/generate/msg-template/gemini', geminiApiController.generateTemplateGemini);

module.exports = router;
