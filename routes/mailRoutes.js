const express = require('express');
const mailController = require('../controllers/mailController');
const Router = express.Router();
Router.post('/submit/:mail', mailController.sendMailtoUser);
module.exports = Router;
