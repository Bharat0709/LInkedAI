const express = require('express');
const mailController = require('../controllers/mailController');
const Router = express.Router();
Router.post('/submit/:mail', mailController.sendAccess);
Router.post('/otp/:mail', mailController.sendOTPtoUser);
module.exports = Router;
