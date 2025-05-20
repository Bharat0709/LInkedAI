const express = require('express');
const organizationAuthController = require('../controllers/orgAuthController');
const authController = require('../controllers/authController');
const organizationController = require('../controllers/organizationController');
const hiringPostsController = require('../controllers/hiringPostsController');
const upload = require('../middlewares/multer');

const Router = express.Router();

Router.post('/auth/signup', organizationAuthController.signupOrganization);
Router.post('/auth/login', organizationAuthController.loginOrganization);
Router.post('/auth/forgot-password', organizationAuthController.forgotPassword);
Router.post(
  '/auth/reset-password/:token',
  organizationAuthController.resetPassword
);
Router.post(
  '/mail/help',
  authController.isUserLoggedIn,
  organizationController.sendHelpRequest
);

Router.post(
  '/mail/feedback',
  authController.isUserLoggedIn,
  organizationController.Organizationfeedback
);

Router.get(
  '/auth',
  authController.isUserLoggedIn,
  organizationAuthController.verifyOrganizationDetails
);

Router.get(
  '/:organizationId/hiring-posts',
  authController.isUserLoggedIn,
  hiringPostsController.getOrganizationHiringPosts
);

Router.get('/auth/google', organizationAuthController.googleAuth);

Router.get(
  '/auth/google/callback',
  organizationAuthController.googleAuthCallback
);

Router.put(
  '/profile/update',
  authController.isUserLoggedIn,
  upload.single('profilePicture'),
  organizationController.updateProfile
);

module.exports = Router;
