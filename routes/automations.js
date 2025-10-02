// routes/automationRoutes.js
const express = require('express');
const automationController = require('../controllers/Leads/automationController');
const { verifyToken } = require('../middlewares/verifytoken');
const router = express.Router();

// Approve automation - Done
router.patch('/:memberId/:id/approve', automationController.approveAutomation);

// Reject automation - Done
router.patch('/:memberId/:id/reject', automationController.rejectAutomation);

// Create a new automation - Done
router.post('/:memberId/:organizationId', automationController.createAutomation);

// Apply authentication middleware to all routes
router.use(verifyToken);

// Updater Automation - Done
router.patch('/:memberId/:id', automationController.updateAutomation);

// Get all automations for the authenticated organization - Done
router.get('/:memberId', automationController.getAutomations);

// Get automation statistics - Pending
router.get('/:memberId/stats', automationController.getAutomationStats);

// Get pending approvals - Done
router.get('/:memberId/pending-approvals', automationController.getPendingApprovals);

// Get scheduled automations - Done
router.get('/:memberId/scheduled', automationController.getScheduledAutomations);

// Get recurring automations - Done
router.get('/:memberId/recurring', automationController.getRecurringAutomations);

// Get overdue automations
// router.get('/overdue', automationController.getOverdueAutomations);

// Get due automations (for background processing)
// router.get('/due', automationController.getDueAutomations);

// Bulk approve automations
router.patch('/bulk-approve', automationController.bulkApproveAutomations);

// Bulk reject automations
router.patch('/bulk-reject', automationController.bulkRejectAutomations);

// Bulk cancel automations
router.patch('/bulk-cancel', automationController.bulkCancelAutomations);

// Bulk retry failed automations
router.patch('/bulk-retry', automationController.bulkRetryAutomations);

// Get single automation by ID - Done
router.get('/:memberId/:id', automationController.getAutomation);

// Schedule automation -  Done
router.patch('/:memberId/:id/schedule', automationController.scheduleAutomation);

// Reschedule automation
router.patch('/:id/reschedule', automationController.rescheduleAutomation);

// Update automation status - Done
router.patch('/:memberId/:id/status', automationController.updateAutomationStatus);

// Update automation priority - Pending
router.patch('/:id/priority', automationController.updateAutomationPriority);

// Update delivery status (for webhook callbacks) // ADMIN
router.patch('/:memberId/:id/delivery-status', automationController.updateDeliveryStatus);

// Delete automation - Done
router.delete('/:memberId/:id', automationController.deleteAutomation);

module.exports = router;
