const express = require('express');
const memberController = require('../controllers/memberController');
const authController = require('../controllers/authController');
const Router = express.Router();

Router.post('/checkMember', memberController.checkMemberExists);

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

Router.get(
  '/all',
  authController.isUserLoggedIn,
  memberController.getAllMembersOfOrganization
);
module.exports = Router;
