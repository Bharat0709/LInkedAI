const dotenv = require('dotenv');
dotenv.config();
const sendFrostmailEmail = require('../../config/mailConfig');
const compileTemplate = require('../../utils/mailUtils/compileTemplate');

// ORGANIZATION - SEND RESET PASSWORD URL
exports.sendResetPasswordURL = async (email, subject, resetURL) => {
  const html = compileTemplate('authentication/password_reset', { resetURL });
  return await sendFrostmailEmail(email, subject, html);
};

// ORGANIZATION - PASSWORD CHANGE CONFIRMATION - AUTOMATED
exports.sendPasswordChangedConfirmation = async (user) => {
  const html = compileTemplate('authentication/password_changed', {
    name: user.name,
    changedAt: new Date().toLocaleString(),
  });

  return await sendFrostmailEmail(
    user.email,
    'Your Password Was Changed',
    html
  );
};

// ORGANIZATION - WELCOME EMAIL - NOT IN USE [SCALABILITY ISSUE]
exports.sendWelcomeEmail = async (email, name) => {
  const html = compileTemplate('authentication/welcome', {
    name,
    year: new Date().getFullYear(),
  });

  return await sendFrostmailEmail(email, '👋 Welcome to EngageGPT!', html);
};
