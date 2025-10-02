const express = require('express');
const router = express.Router();
const creditExpiryController = require('../controllers/Admin/CreditsExpiry/CreditsExpiryController');
const { verifyToken } = require('../middlewares/verifytoken');

router.use(verifyToken);
router.get('/credits/expire/:password', creditExpiryController.expireCredits);
router.get('/credits/stats/:password', creditExpiryController.getExpiryStats);
router.post('/credits/notify/:password', creditExpiryController.sendExpiryNotifications);

module.exports = router;
