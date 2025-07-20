const dotenv = require('dotenv');
dotenv.config();
const sendFrostmailEmail = require('../../config/mailConfig');
const compileTemplate = require('../../utils/mailUtils/compileTemplate');

// ORGANIZATION - SEND RESET PASSWORD URL
const sendResetPasswordURL = async (email, subject, resetURL) => {
  const html = compileTemplate('authentication/password_reset', { resetURL });
  return await sendFrostmailEmail(email, subject, html);
};

// ORANIZATION - SEND EMAIL VERIFICATION MAIL
const sendVerificationMail = async (email, subject, verificationURL) => {
  const html = compileTemplate('authentication/email_verification', { verificationURL });
  return await sendFrostmailEmail(email, subject, html);
};

// ORGANIZATION - PASSWORD CHANGE CONFIRMATION - AUTOMATED
const sendPasswordChangedConfirmation = async user => {
  const html = compileTemplate('authentication/password_changed', {
    name: user.name,
    changedAt: new Date().toLocaleString(),
  });

  return await sendFrostmailEmail(user.email, 'Your Password Was Changed', html);
};

// ORGANIZATION - WELCOME EMAIL - NOT IN USE [SCALABILITY ISSUE]
const sendWelcomeEmail = async (email, name) => {
  const html = compileTemplate('authentication/welcome', {
    name,
    year: new Date().getFullYear(),
  });

  return await sendFrostmailEmail(email, '👋 Welcome to EngageGPT!', html);
};

module.exports = {
  sendResetPasswordURL,
  sendVerificationMail,
  sendPasswordChangedConfirmation,
  sendWelcomeEmail,
};
