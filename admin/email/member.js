const dotenv = require('dotenv');
dotenv.config();

const sendFrostmailEmail = require('../../config/mailConfig');
const compileTemplate = require('../mailUtils/compileTemplate');

// MEMBER - SEND NEW MEMBER INVITE EMAIL
exports.sendNewMemberInviteEmail = async (OrganizationName, MemberName, MemberEmail, ConnectionToken) => {
  const html = compileTemplate('onboarding/new_member_invite', {
    OrganizationName,
    MemberName,
    ConnectionToken,
  });

  return await sendFrostmailEmail(MemberEmail, '🚀 Connect to EngageGPT - Member Invitation', html);
};

// MEMBER - SEND POST SCHEDULED STATUS EMAIL - CRON JOB
exports.sendPostStatusEmail = async (email, post, status, errorMessage = '') => {
  const isSuccess = status.toLowerCase() === 'posted';

  const html = compileTemplate('linkedin/post_confirmation', {
    isSuccess,
    post,
    errorMessage,
    subject: isSuccess ? 'LinkedIn Post Success' : 'LinkedIn Post Failure',
  });

  return await sendFrostmailEmail(email, isSuccess ? '✅ Your LinkedIn Post Was Successfully Published!' : '⚠️ LinkedIn Post Failed to Publish', html);
};

// MEMBER - CONNECTION CONFIRMATION MAIL
exports.sendExtensionConnectedConfirmation = async user => {
  const html = compileTemplate('onboarding/extension_connected', {
    name: user.name,
    year: new Date().getFullYear(),
  });

  return await sendFrostmailEmail(user.email, '✅ EngageGPT Extension Connected Successfully', html);
};

// MEMBER - ONBOARDING COMPLETION - NOT IN USE
exports.sendOnboardingCompleteEmail = async user => {
  const html = compileTemplate('onboarding/onboardingComplete', {
    name: user.name,
    year: new Date().getFullYear(),
  });

  return await sendFrostmailEmail(user.email, '🎉 Onboarding Complete – Let the LinkedIn Magic Begin!', html);
};

// MEMBER - MILESTONE MAIL
exports.sendMilestoneEmail = async user => {
  const { name, email, daysActive } = user;
  const year = new Date().getFullYear();

  const isSpecial = daysActive % 50 === 0; // 50, 100, 150...
  const templateName = isSpecial ? 'milestones/special_milestone' : 'milestones/regular_milestone';

  const html = compileTemplate(templateName, {
    name,
    year,
    daysActive,
  });

  const subject = isSpecial ? `🎉 ${daysActive} Days of EngageGPT - You're a Star!` : `👏 ${daysActive} Active Days – Keep Going!`;

  return await sendFrostmailEmail(email, subject, html);
};
