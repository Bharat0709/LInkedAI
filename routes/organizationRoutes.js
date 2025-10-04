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
// Protect all routes after thics middleware
router.use(verifyToken);
// Organization profile routes
router.get('/profile', organizationController.getProfile);
router.patch('/profile', upload.single('profilePicture'), organizationController.updateProfile);

router.get('/:id', organizationController.getOrganizationById);
router.delete('/:id', organizationController.deleteOrganization);

// Support routes
router.post('/help', organizationController.sendHelpRequest);
router.post('/feedback', organizationController.sendFeedback);

module.exports = router;
