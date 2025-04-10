const express = require('express');
const memberController = require('../controllers/memberController');
const authController = require('../controllers/authController');
const linkedInAuthController = require('../controllers/memberLinkedInAuth');
const linkedInController = require('../controllers/linkedInController');
const integrationUtils = require('../utils/integrations');
const Router = express.Router();

// Authentication Routes
Router.get('/auth/linkedin', linkedInAuthController.linkedinAuth);
Router.get('/auth/linkedin/callback', linkedInAuthController.linkedinAuthCallback);
Router.post('/linkedin/share/:id', linkedInController.parseFormData , linkedInController.shareLinkedInPost);

// Content Calendar Routes
Router.get('/content-calendar/:id', authController.isUserLoggedIn, memberController.getContentCalendar);
Router.post('/content-calendar/:id', authController.isUserLoggedIn, memberController.addContentCalendar);
Router.put('/content-calendar/:id/:contentId', authController.isUserLoggedIn, memberController.updateContentCalendar);
Router.delete('/content-calendar/:id/:contentId', authController.isUserLoggedIn, memberController.deleteContentCalendar);

// Member Routes
Router.post('/checkMember', memberController.checkMemberExists);
Router.get('/:organizationId/:memberId', authController.isUserLoggedIn, memberController.getMemberDetailsByIds);
Router.put('/:id', authController.isUserLoggedIn, memberController.updateMemberDetails);
Router.post('/addConnectionToken', memberController.addConnectionToken);
Router.get('/users', authController.isUserLoggedIn, memberController.getAllUsers);
Router.post('/daysactive', authController.isUserLoggedIn, memberController.updateDaysActive);
Router.post('/linkedin/disconnect/:memberId', authController.isUserLoggedIn, memberController.disconnectLinkedIn);
Router.post('/lbprofilevisibility', authController.isUserLoggedIn, memberController.updateLeaderboardProfileVisibility);
Router.post('/tagPost', authController.isUserLoggedIn, memberController.updatePostTagging);
Router.post('/create', authController.isUserLoggedIn, memberController.createMember);
Router.post('/createPersona/:id', authController.isUserLoggedIn, memberController.createMemberPersona);
Router.get('/all', authController.isUserLoggedIn, memberController.getAllMembersOfOrganization);

// Integration Routes
Router.post('/integrations/googleSheet', authController.isUserLoggedIn, integrationUtils.fetchGoogleSheetData);

// Survey Route
Router.post('/survey', memberController.submitSurvey);

module.exports = Router;
