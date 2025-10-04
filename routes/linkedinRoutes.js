const express = require('express');
const linkedInController = require('../controllers/LinkedIn/linkedInController');
const linkedInAuthController = require('../controllers/Auth/linkedinAuthController');
const { verifyToken } = require('../middlewares/verifytoken');
const router = express.Router();

router.get('/auth/callback', linkedInAuthController.linkedinAuthCallback);
router.get('/auth', linkedInAuthController.linkedinAuth);

router.use(verifyToken);
router.get('/:memberId/history', linkedInController.getScheduledPosts);
router.patch('/:memberId/disconnect', linkedInController.disconnectLinkedIn);

router.post('/:memberId/schedule', linkedInController.parseFormData, linkedInController.createScheduledPost);
router.post('/:memberId/share', linkedInController.parseFormData, linkedInController.shareLinkedInPost);
router.put('/:postId/history/', linkedInController.parseFormData, linkedInController.updateScheduledPost);
router.delete('/:postId/history/', linkedInController.deleteScheduledPost);

module.exports = router;
