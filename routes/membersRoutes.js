const express = require('express');
const memberController = require('../controllers/memberController');
const gmailController = require('../controllers/GmailController/gmailController')
const integrationUtils = require('../utils/integrations');
const { verifyExtension } = require('../middlewares/verifyExtensionRequest');
const { verifyToken } = require('../middlewares/verifytoken');

// EXTENSION ROUTES
const router = express.Router();

// Authentication Routes
router.post('/check-member', verifyExtension, memberController.checkMemberExists);
router.post('/add-Connection-token', verifyExtension, memberController.addConnectionToken);

router.use(verifyToken);
router.get('/profile', verifyExtension, memberController.getProfile);
router.post('/days-active', verifyExtension, memberController.updateDaysActive);
router.post('/lb-profile-visibility', verifyExtension, memberController.updateLeaderboardProfileVisibility);
router.get('/leader-board', verifyExtension, memberController.getLeaderboard);
router.put('/profile-stats/:id', verifyExtension, memberController.updateMemberProfileStats);


router.post('/add-member', memberController.createMember);
router.get('/profile/:memberId', memberController.getMemberDetailsById);
router.get('/associated-members', memberController.getAllMembersOfOrganization);
router.get('/:organizationId/:memberId', memberController.getMemberDetailsByIds);
router.get('/summary/:memberId', memberController.getMemberSummary);
router.post('/reset-credits/:memberId'  , memberController.updateCreditsUsedToday)
router.put('/lead-generation-settings/:memberId', memberController.updateLeadGenerationGoals);
router.put('/summary/:memberId', memberController.updateCompleteSummary);
router.put('/settings/:memberId', memberController.updateMemberSettings);
router.patch('/feed-filters/:memberId', memberController.updateFeedFilterSettings);
router.post('/mail/send/:memberId', gmailController.sendGmail); 
router.delete('/mail/disconnect/:memberId', gmailController.disconnectGmail);

router.delete('/deleteAccount/:memberId', memberController.deleteMemberAccount);
router.post('/integrationds/googleSheet', integrationUtils.fetchGoogleSheetData);

// Survey Route
router.post('/survey', memberController.submitSurvey);

module.exports = router;
