const express = require('express');
const memberController = require('../controllers/memberController');
const authController = require('../controllers/authController');
const linkedInAuthController = require('../controllers/memberLinkedInAuth');
const linkedInController = require('../controllers/linkedInController');
const integrationUtils = require('../utils/integrations');
const { verifyExtension } = require('../middlewares/verifyExtensionRequest');
const { verifyToken } = require('../middlewares/verifytoken');
// EXTENSION ROUTES
const { checkSubscriptionStatus } = require('../middlewares/checkSubscriptionStatus');
const Router = express.Router();

// Authentication Routes
Router.post('/check-member', verifyExtension, memberController.checkMemberExists);
Router.post('/add-Connection-token', verifyExtension, memberController.addConnectionToken);

Router.use(verifyToken);
Router.get('/profile', verifyExtension, memberController.getProfile);
Router.post('/days-active', verifyExtension, checkSubscriptionStatus, memberController.updateDaysActive);
Router.post('/lb-profile-visibility', verifyExtension, checkSubscriptionStatus, memberController.updateLeaderboardProfileVisibility);
Router.get('/leader-board', verifyExtension, checkSubscriptionStatus, memberController.getLeaderboard);
Router.put('/profile-stats/:id', verifyExtension, memberController.updateMemberProfileStats);

Router.get('/associated-members', memberController.getAllMembersOfOrganization);

Router.post('/add-member', checkSubscriptionStatus, memberController.createMember);
Router.get('/profile/:memberId', checkSubscriptionStatus, memberController.getMemberDetailsById);
Router.get('/:organizationId/:memberId', memberController.getMemberDetailsByIds);
Router.get('/summary/:memberId', memberController.getMemberSummary);


Router.post('/linkedin/disconnect/:memberId', memberController.disconnectLinkedIn);
Router.post('/linkedin/schedule/:id', linkedInController.parseFormData, linkedInController.createScheduledPost);
Router.post('/linkedin/share/:id', linkedInController.parseFormData, linkedInController.shareLinkedInPost);
Router.get('/auth/linkedin', linkedInAuthController.linkedinAuth);
Router.get('/auth/linkedin/callback', linkedInAuthController.linkedinAuthCallback);
Router.get('/linkedin/history/:id', linkedInController.getScheduledPosts);
Router.put('/linkedin/history/:id', linkedInController.parseFormData, linkedInController.updateScheduledPost);
Router.delete('/linkedin/history/:id', linkedInController.deleteScheduledPost);

// Content Calendar Routes
Router.get('/content-calendar/:id', memberController.getContentCalendar);
Router.post('/content-calendar/:id', memberController.addContentCalendar);
Router.put('/content-calendar/:id/:contentId', memberController.updateContentCalendar);
Router.delete('/content-calendar/:id/:contentId', memberController.deleteContentCalendar);

// Member Routes

Router.put('/lead-generation-settings/:memberId', memberController.updateLeadGenerationGoals);
Router.put('/summary/:memberId', memberController.updateCompleteSummary);
Router.put('/settings/:memberId', memberController.updateMemberSettings);
Router.patch('/feed-filters/:memberId', memberController.updateFeedFilterSettings);

Router.delete('/deleteAccount/:memberId', memberController.deleteMemberAccount);
Router.post('/integrations/googleSheet', integrationUtils.fetchGoogleSheetData);

// Survey Route
Router.post('/survey', memberController.submitSurvey);

module.exports = Router;
