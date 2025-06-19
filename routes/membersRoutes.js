const express = require('express');
const memberController = require('../controllers/memberController');
const authController = require('../controllers/authController');
const linkedInAuthController = require('../controllers/memberLinkedInAuth');
const linkedInController = require('../controllers/linkedInController');
const integrationUtils = require('../utils/integrations');
const Router = express.Router();

// Authentication Routes
Router.post('/linkedin/schedule/:id',  authController.isUserLoggedIn ,linkedInController.parseFormData , linkedInController.createScheduledPost);
Router.post('/linkedin/share/:id',authController.isUserLoggedIn, linkedInController.parseFormData , linkedInController.shareLinkedInPost);
Router.get('/auth/linkedin', linkedInAuthController.linkedinAuth);
Router.get('/auth/linkedin/callback', linkedInAuthController.linkedinAuthCallback);
Router.get('/linkedin/history/:id',  authController.isUserLoggedIn ,linkedInController.getScheduledPosts);
Router.put('/linkedin/history/:id' , authController.isUserLoggedIn , linkedInController.parseFormData ,  linkedInController.updateScheduledPost);
Router.delete('/linkedin/history/:id' , authController.isUserLoggedIn ,linkedInController.deleteScheduledPost);

// Content Calendar Routes
Router.get('/content-calendar/:id', authController.isUserLoggedIn, memberController.getContentCalendar);
Router.post('/content-calendar/:id', authController.isUserLoggedIn, memberController.addContentCalendar);
Router.put('/content-calendar/:id/:contentId', authController.isUserLoggedIn, memberController.updateContentCalendar);
Router.delete('/content-calendar/:id/:contentId', authController.isUserLoggedIn, memberController.deleteContentCalendar);

// Member Routes
Router.post('/checkMember', memberController.checkMemberExists);
Router.get('/member-profile/:memberId', authController.isUserLoggedIn, memberController.getMemberDetailsById);
Router.get('/:organizationId/:memberId', authController.isUserLoggedIn, memberController.getMemberDetailsByIds);
Router.get('/summary/:memberId', authController.isUserLoggedIn, memberController.getMemberSummary);
Router.put('/lead-generation-settings/:memberId', authController.isUserLoggedIn, memberController.updateLeadGenerationGoals);
Router.put('/:id', authController.isUserLoggedIn, memberController.updateMemberDetails);
Router.put('/summary/:memberId', authController.isUserLoggedIn, memberController.updateCompleteSummary);
Router.put('/settings/:memberId', authController.isUserLoggedIn, memberController.updateMemberSettings);
Router.post('/addConnectionToken', memberController.addConnectionToken);
Router.patch('/feed-filters/:memberId' , authController.isUserLoggedIn , memberController.updateFeedFilterSettings);
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
