const express = require('express');
const organizationController = require('../controllers/organizationController');
const { verifyToken } = require('../middlewares/verifytoken');
const multer = require('multer');
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post('/check-verification', organizationController.checkVerificationStatus);
// Protect all routes after this middleware
router.use(verifyToken);
// Organization profile routes
router.get('/profile', organizationController.getProfile);
router.patch('/profile', upload.single('profilePicture'), organizationController.updateProfile);
router.get('/trial-status', organizationController.checkTrialStatus);

// Organization management routes
router.get('/:id', organizationController.getOrganizationById);
router.delete('/:id', organizationController.deleteOrganization);

// Credits and subscription routes
router.patch('/credits', organizationController.updateCredits);
router.patch('/subscription', organizationController.updateSubscription);

// Trial and usage management routes
router.get('/usage-limits/:usageType', organizationController.checkUsageLimits);
router.patch('/usage/:usageType', organizationController.incrementUsage);

// Support routes
router.post('/help', organizationController.sendHelpRequest);
router.post('/feedback', organizationController.sendFeedback);

module.exports = router;
