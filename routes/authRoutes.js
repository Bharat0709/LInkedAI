const express = require('express');
const authController = require('./../controllers/authController');
const memberController = require('./../controllers/memberController');
const Router = express.Router();

Router.get('/verify', authController.isUserLoggedIn, memberController.verifyMemberDetails);
Router.post('/addtowaitlist', authController.addtoWaitlist);
Router.post('/addConnectionToken', memberController.addConnectionToken);

module.exports = Router;
