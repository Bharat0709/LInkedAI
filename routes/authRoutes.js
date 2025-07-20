const express = require('express');
const authController = require('./../controllers/authController');
const router = express.Router();

// SIGNUP
router.post('/signup/initiate', authController.initiateSignup);
router.post('/verify-email', authController.verifyEmail);
router.post('/signup/complete', authController.completeSignup);
router.post('/resend-verification', authController.resendVerificationEmail);

// LOGIN OR RESET
router.post('/login', authController.loginOrganization);
router.post('/password-reset/initiate', authController.initiatePasswordReset);
router.post('/password-reset', authController.resetPassword);

// GOOGLE AUTH
router.get('/google', authController.googleAuth);
// router.get('/google/callback', authController.googleAuthCallback);

module.exports = router;
