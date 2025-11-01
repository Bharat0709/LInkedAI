const dotenv = require('dotenv');
dotenv.config();
const fs = require('fs');
const sendFrostmailEmail = require('../../config/mailConfig');
const compileTemplate = require('../mailUtils/compileTemplate');
const sendAutoSendEmail = require('../../config/autoSendConfig');
const admin1 = process.env.ADMIN_EMAIL1;

// TO ADMIN - SURVEY FORM - MANUALLY BY ORGANIZATION
exports.sendSurveyForm = async (usability, performance, missingFeatures, reason, email, overallSatisfaction) => {
  const html = compileTemplate('adminMails/extn_survey', {
    usability,
    performance,
    missingFeatures,
    reason,
    email,
    overallSatisfaction,
  });

  return await sendFrostmailEmail(admin1, '📝 Survey Feedback Received', html);
};

// TO ADMIN - NEW USER CONNECTED - AUTOMATED
exports.sendNewUserEmail = async user => {
  const html = compileTemplate('adminMails/new_extn_user', {
    name: user.name,
    email: user.email,
    profileLink: user.profileLink,
    accountCreatedAt: new Date(user.accountCreatedAt).toLocaleString(),
  });

  return await sendAutoSendEmail(admin1, 'New User Added', html);
};

// TO ADMIN - USER NEEDS HELP - MANUALLY BY ORGANIZATION
exports.sendHelpRequest = async (user, helpMessage) => {
  const html = compileTemplate('adminMails/help_request', {
    name: user?.name || 'N/A',
    email: user?.email || 'N/A',
    helpMessage,
  });

  return await sendAutoSendEmail(admin1, `Help Request from ${user?.name}`, html);
};

// TO ADMIN - USER FEEDBACK - MANUALLY BY ORGANIZATION
exports.sendFeedback = async (organization, rating, feedbackText) => {
  const html = compileTemplate('adminMails/feedback', {
    name: organization?.name,
    email: organization?.email,
    rating,
    feedback: feedbackText,
  });

  return await sendAutoSendEmail(admin1, `Feedback from ${organization?.name}`, html);
};

// TO ADMIN - DAILY STATS REPORT - AUTOMATED CRON JOB
exports.sendDailyStatsReport = async (stats, csvPath = null) => {
  const html = compileTemplate('adminMails/daily_report', stats);

  // Prepare attachments if CSV path is provided
  let attachments = [];
  if (csvPath && fs.existsSync(csvPath)) {
    attachments = [
      {
        path: csvPath,
        filename: `daily-users-report-${stats.reportDate.replace(/\s/g, '-')}.csv`,
        contentType: 'text/csv',
      },
    ];
  }

  // Send to both admins with attachments
  return await sendFrostmailEmail(admin1, `Daily Platform Stats - ${stats.reportDate}`, html, attachments);
};

exports.sendCreditsExpiringNotification = async ({ org, creditsLeft, expiresAt }) => {

  const html = compileTemplate('account/credits_expiry', {
    name: org?.name || 'User',
    creditsLeft,
    expiryDate: expiresAt.toLocaleString(),  
    dashboardUrl: 'https://engagegpt.in/dashboard',
    year: new Date().getFullYear(),
  });

  return await sendAutoSendEmail(
    org.email,
    '⚠️ Your EngageGPT Credits Are Expiring Soon',
    html
  );
};
