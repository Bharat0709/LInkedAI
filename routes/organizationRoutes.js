const express = require('express');
const organizationController = require('../controllers/orgAuthController');
const authController = require('../controllers/authController');

const Router = express.Router();
Router.get(
  '/',
  authController.isUserLoggedIn,
  organizationController.verifyOrganizationDetails
);
Router.post('/signup', organizationController.signupOrganization);
Router.post('/login', organizationController.loginOrganization);
Router.get('/google', organizationController.googleAuth);
Router.get('/google/callback', organizationController.googleAuthCallback);

module.exports = Router;
