const express = require('express');
const organizationAuthController = require('../controllers/orgAuthController');
const authController = require('../controllers/authController');
const organizationController = require('../controllers/organizationController');

const Router = express.Router();
Router.get(
  '/auth',
  authController.isUserLoggedIn,
  organizationAuthController.verifyOrganizationDetails
);
Router.post('/auth/signup', organizationAuthController.signupOrganization);
Router.post('/auth/login', organizationAuthController.loginOrganization);
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
Router.get('/auth/google', organizationAuthController.googleAuth);
Router.get(
  '/auth/google/callback',
  organizationAuthController.googleAuthCallback
);

module.exports = Router;
