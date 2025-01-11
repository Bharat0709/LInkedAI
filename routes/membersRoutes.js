const express = require('express');
const memberController = require('../controllers/memberController');
const authController = require('../controllers/authController');
const linkedInAuthController = require('../controllers/memberLinkedInAuth');
const linkedInController = require('../controllers/linkedInController');
const integrationUtils = require('../utils/integrations');
const Router = express.Router();

Router.get('/auth/linkedin', linkedInAuthController.linkedinAuth);
Router.post('/checkMember', memberController.checkMemberExists);

Router.get(
  '/auth/linkedin/callback',
  linkedInAuthController.linkedinAuthCallback
);

Router.post(
  '/linkedin/share/:id',
  authController.isUserLoggedIn,
  linkedInController.parseFormData,
  linkedInController.shareLinkedInPost
);

Router.get(
  '/content-calender/:id',
  authController.isUserLoggedIn,
  memberController.getContentCalendar
);

Router.get(
  '/:organizationId/:memberId',
  authController.isUserLoggedIn,
  memberController.getMemberDetailsByIds
);

Router.put(
  '/:id',
  authController.isUserLoggedIn,
  memberController.updateMemberDetails
);

Router.post('/addConnectionToken', memberController.addConnectionToken);

Router.get(
  '/users',
  authController.isUserLoggedIn,
  memberController.getAllUsers
);

Router.post(
  '/daysactive',
  authController.isUserLoggedIn,
  memberController.updateDaysActive
);

Router.post(
  '/linkedin/disconnect/:memberId',
  authController.isUserLoggedIn,
  memberController.disconnectLinkedIn
);

Router.post(
  '/lbprofilevisibility',
  authController.isUserLoggedIn,
  memberController.updateLeaderboardProfileVisibility
);

Router.post(
  '/tagPost',
  authController.isUserLoggedIn,
  memberController.updatePostTagging
);

Router.post(
  '/create',
  authController.isUserLoggedIn,
  memberController.createMember
);

Router.post(
  '/createPersona/:id',
  authController.isUserLoggedIn,
  memberController.createMemberPersona
);

Router.get(
  '/all',
  authController.isUserLoggedIn,
  memberController.getAllMembersOfOrganization
);

Router.post(
  '/integrations/googleSheet',
  authController.isUserLoggedIn,
  integrationUtils.fetchGoogleSheetData
);

Router.post('/survey', memberController.submitSurvey);

Router.post(
  '/content-calender/:id',
  authController.isUserLoggedIn,
  memberController.addContentCalendar
);

module.exports = Router;
