const express = require('express');
const savedPostController = require('../controllers/Leads/savedPostController');
const { verifyToken } = require('../middlewares/verifytoken');
const { verifyExtension } = require('../middlewares/verifyExtensionRequest');
const router = express.Router();

// Update email content
router.patch('/:id/email-info', savedPostController.updateEmailContent);

// Create a new saved post
router.use(verifyToken);
// Get saved post statistics
router.get('/', savedPostController.getSavedPosts);

router.post('/', verifyExtension, savedPostController.createSavedPost);
// Get all saved posts for the authenticated user/organization
router.get('/stats', savedPostController.getSavedPostStats);

// Get due posts (follow-up required)
router.get('/due', savedPostController.getDuePosts);

// Get expiring posts (follow-up approaching)
router.get('/expiring', savedPostController.getExpiringPosts);

// Get members with saved posts statistics
router.get('/members', savedPostController.getMembersWithSavedPosts);

router.patch('/bulk-status', savedPostController.bulkUpdateStatus);

// Bulk update priority
router.patch('/bulk-priority', savedPostController.bulkUpdatePriority);

router.patch('/bulk-automation', savedPostController.bulkUpdateAutomation);

// Bulk delete posts
router.delete('/bulk-delete', savedPostController.bulkDeleteSavedPosts);
// Bulk update saved posts
router.patch('/bulk-update', savedPostController.bulkUpdateSavedPosts);

// Get a single saved post
router.get('/:id', savedPostController.getSavedPost);

router.patch('/:id', savedPostController.updateSavedPost);

// Update saved post status
router.patch('/:id/status', savedPostController.updateSavedPostStatus);

// Update saved post notes
router.patch('/:id/notes', savedPostController.updateSavedPostNotes);

// Update saved post category
router.patch('/:id/category', savedPostController.updateCategory);

// Update saved post priority
router.patch('/:id/priority', savedPostController.updatePriority);

// Update saved post tags
router.patch('/:id/tags', savedPostController.updateTags);

// Update follow-up date
router.patch('/:id/follow-up', savedPostController.updateFollowUpDate);

// Update lead information
router.patch('/:id/lead-info', savedPostController.updateLeadInfo);

// Delete a saved post
router.delete('/:id', savedPostController.deleteSavedPost);

module.exports = router;
