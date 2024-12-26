const express = require('express');
const organizationController = require('../controllers/orgAuthController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get(
  '/',
  authController.isUserLoggedIn,
  organizationController.verifyOrganizationDetails
);
router.post('/signup', organizationController.signupOrganization);
router.post('/login', organizationController.loginOrganization);
router.get('/google', organizationController.googleAuth);
router.get('/google/callback', organizationController.googleAuthCallback);

module.exports = router;
