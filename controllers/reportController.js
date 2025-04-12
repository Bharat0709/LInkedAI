// controllers/reportController.js
const Member = require('../models/members');
const Organization = require('../models/organization');
const catchAsync = require('../utils/catchAsync');
const ExcelJS = require('exceljs');
const Mailgun = require('mailgun-js');
const path = require('path');
const fs = require('fs');
const os = require('os');
const dotenv = require('dotenv');
dotenv.config();

// Configure mailgun
const api_key = process.env.MAILGUN_API_KEY;
const adminEmail = 'pahwabharat15@gmail.com';
const domain = 'support.engagegpt.in';
var from_who = 'engagegpt@gmail.com';
const mailgun = new Mailgun({ apiKey: api_key, domain: domain });

// Helper function to get date string
const getTodayDateString = () => {
  const date = new Date();
  return date.toISOString().split('T')[0];
};

// Get 24-hour user stats
const get24HourUserStats = async () => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Get new users in the last 24 hours
  const newUsers = await Member.find({
    accountCreatedAt: { $gte: oneDayAgo },
  });

  // Get recently active users in the last 24 hours
  const activeUsers = await Member.find({
    lastActive: { $gte: oneDayAgo },
  });

  // Get users who recently synced with LinkedIn
  const recentlySynced = await Member.find({
    lastSyncedAt: { $gte: oneDayAgo.toISOString() },
  });

  return {
    newUsersCount: newUsers.length,
    newUsers,
    activeUsersCount: activeUsers.length,
    recentlySyncedCount: recentlySynced.length,
    recentlySynced,
  };
};

// Get overall user stats
const getOverallUserStats = async () => {
  const totalUsers = await Member.countDocuments();
  const connectedUsers = await Member.countDocuments({
    isConnected: 'connected',
  });
  const linkedConnectedUsers = await Member.countDocuments({
    isLinkedinConnected: true,
  });

  // Get organization stats
  const totalOrganizations = await Organization.countDocuments();

  return {
    totalUsers,
    connectedUsers,
    linkedConnectedUsers,
    percentConnected: ((connectedUsers / totalUsers) * 100).toFixed(2),
    percentLinkedinConnected: (
      (linkedConnectedUsers / totalUsers) *
      100
    ).toFixed(2),
    totalOrganizations,
  };
};

// Generate Excel report with all user data
const generateExcelReport = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('User Report');

  // Set headers
  worksheet.columns = [
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Email', key: 'email', width: 40 },
    { header: 'LinkedIn Profile', key: 'profileLink', width: 50 },
    { header: 'Connected to LinkedIn', key: 'isLinkedinConnected', width: 20 },
    { header: 'Last Synced', key: 'lastSyncedAt', width: 20 },
    { header: 'Last Active', key: 'lastActive', width: 20 },
    { header: 'Days Active', key: 'daysActive', width: 15 },
    { header: 'Credits', key: 'credits', width: 10 },
    { header: 'Total Credits Used', key: 'totalCreditsUsed', width: 20 },
    { header: 'Followers Count', key: 'followersCount', width: 15 },
    { header: 'Following Count', key: 'followingCount', width: 15 },
    { header: 'Connections Count', key: 'connectionsCount', width: 15 },
    { header: 'Profile Views', key: 'profileViews', width: 15 },
    { header: 'Account Created', key: 'accountCreatedAt', width: 20 },
  ];

  // Get all users
  const users = await Member.find({}).lean();

  // Add users to the worksheet
  users.forEach((user) => {
    worksheet.addRow({
      name: user.name || 'N/A',
      email: user.email || 'N/A',
      profileLink: user.profileLink || 'N/A',
      isLinkedinConnected: user.isLinkedinConnected ? 'Yes' : 'No',
      lastSyncedAt: user.lastSyncedAt || 'Never',
      lastActive: user.lastActive
        ? new Date(user.lastActive).toLocaleString()
        : 'N/A',
      daysActive: user.daysActive || 0,
      credits: user.credits || 0,
      totalCreditsUsed: user.totalCreditsUsed || 0,
      followersCount: user.followersCount || 0,
      followingCount: user.followingCount || 0,
      connectionsCount: user.connectionsCount || 0,
      profileViews: user.profileViews || 0,
      accountCreatedAt: user.accountCreatedAt
        ? new Date(user.accountCreatedAt).toLocaleString()
        : 'N/A',
    });
  });

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD3D3D3' },
  };

  // Generate a temporary file path
  const tempFilePath = path.join(
    os.tmpdir(),
    `user_report_${getTodayDateString()}.xlsx`
  );

  await workbook.xlsx.writeFile(tempFilePath);
  return tempFilePath;
};

// Generate and send daily report
exports.generateDailyReport = catchAsync(async () => {
  console.log('📊 Generating daily user report...');

  try {
    // Get user statistics
    const dailyStats = await get24HourUserStats();
    const overallStats = await getOverallUserStats();

    // Generate Excel report
    const excelFilePath = await generateExcelReport();

    // Create HTML email content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>EngageGPT Daily User Report</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
          }
          .container {
            width: 100%;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background-color: #007bff;
            padding: 20px;
            text-align: center;
            color: #ffffff;
            font-size: 24px;
            font-weight: bold;
          }
          .content {
            padding: 20px;
            color: #333333;
            font-size: 16px;
            line-height: 1.5;
          }
          .section {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
          }
          .section-title {
            color: #007bff;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .stat-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .stat-item {
            background: #f5f7fb;
            padding: 10px;
            border-radius: 6px;
          }
          .stat-label {
            font-size: 14px;
            color: #666;
          }
          .stat-value {
            font-size: 20px;
            font-weight: bold;
            color: #333;
          }
          .highlight {
            color: #007bff;
          }
          .footer {
            background-color: #f1f1f1;
            padding: 15px;
            text-align: center;
            font-size: 14px;
            color: #888888;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            font-size: 14px;
          }
          th {
            background-color: #f2f2f2;
          }
          .note {
            font-style: italic;
            font-size: 13px;
            color: #777;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="email-wrapper">
            <div class="header">
              EngageGPT Daily User Report
            </div>
            <div class="content">
              <p>Hi Bharat,</p>
              <p>Here is your daily user report for <strong>${getTodayDateString()}</strong>. A detailed Excel report is attached to this email.</p>
              
              <div class="section">
                <div class="section-title">24-Hour Activity</div>
                <div class="stat-grid">
                  <div class="stat-item">
                    <div class="stat-label">New Users</div>
                    <div class="stat-value">${dailyStats.newUsersCount}</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-label">Active Users</div>
                    <div class="stat-value">${dailyStats.activeUsersCount}</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-label">Recently Synced</div>
                    <div class="stat-value">${
                      dailyStats.recentlySyncedCount
                    }</div>
                  </div>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">Overall Statistics</div>
                <div class="stat-grid">
                  <div class="stat-item">
                    <div class="stat-label">Total Users</div>
                    <div class="stat-value">${overallStats.totalUsers}</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-label">LinkedIn Connected</div>
                    <div class="stat-value">${
                      overallStats.connectedUsers
                    } <span style="font-size: 14px;">(${
      overallStats.percentLinkedinConnected
    }%)</span></div>
                  </div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-label">Organizations</div>
                    <div class="stat-value">${
                      overallStats.totalOrganizations
                    }</div>
                  </div>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">New Users (Last 24 Hours)</div>
                <table>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>LinkedIn Profile</th>
                  </tr>
                  ${dailyStats.newUsers
                    .map(
                      (user) => `
                    <tr>
                      <td>${user.name || 'N/A'}</td>
                      <td>${user.email || 'N/A'}</td>
                      <td><a href="${
                        user.profileLink || '#'
                      }" target="_blank">${
                        user.profileLink ? 'View Profile' : 'N/A'
                      }</a></td>
                    </tr>
                  `
                    )
                    .join('')}
                </table>
                ${
                  dailyStats.newUsers.length === 0
                    ? '<p class="note">No new users in the last 24 hours.</p>'
                    : ''
                }
              </div>
              
              <div class="section">
                <div class="section-title">Recently Synced Users (Last 24 Hours)</div>
                <table>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Synced At</th>
                  </tr>
                  ${dailyStats.recentlySynced
                    .map(
                      (user) => `
                    <tr>
                      <td>${user.name || 'N/A'}</td>
                      <td>${user.email || 'N/A'}</td>
                      <td>${user.lastSyncedAt || 'N/A'}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </table>
                ${
                  dailyStats.recentlySynced.length === 0
                    ? '<p class="note">No users have synced their profiles in the last 24 hours.</p>'
                    : ''
                }
              </div>
              
              <p class="note">A complete Excel report with detailed information about all users is attached to this email.</p>
            </div>
            <div class="footer">
              <p>EngageGPT - AI for LinkedIn</p>
              <p>This report is confidential and contains sensitive user information.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email with attachment
    const emailData = {
      from: from_who,
      to: adminEmail,
      subject: `EngageGPT Daily User Report - ${getTodayDateString()}`,
      html: htmlContent,
      attachment: excelFilePath,
    };

    // Send email using Mailgun
    await new Promise((resolve, reject) => {
      mailgun.messages().send(
        {
          from: emailData.from,
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          attachment: fs.createReadStream(emailData.attachment),
        },
        function (err, body) {
          if (err) {
            console.error('Error sending report email:', err);
            reject(err);
          } else {
            console.log('Daily report email sent successfully!');
            resolve(body);
          }
        }
      );
    });

    // Clean up temporary file
    fs.unlinkSync(excelFilePath);

    return {
      status: 'success',
      message: 'Daily report generated and sent successfully',
    };
  } catch (error) {
    console.error('Error generating daily report:', error);

    // Send error notification
    mailgun.messages().send({
      from: from_who,
      to: adminEmail,
      subject: 'Error: EngageGPT Daily Report Failed',
      html: `
        <h2>Error Generating Daily Report</h2>
        <p>There was an error generating the daily user report:</p>
        <pre>${error.stack}</pre>
      `,
    });

    throw error;
  }
});

// Manual trigger for authorized admins
exports.triggerDailyReport = catchAsync(async (req, res, next) => {
  // Check if the request is coming from an admin
  const user = req.member;

  if (!user || user.email !== adminEmail) {
    return res.status(403).json({
      status: 'fail',
      message: 'You do not have permission to access this resource',
    });
  }

  await exports.generateDailyReport();

  res.status(200).json({
    status: 'success',
    message: 'Daily report generated and sent successfully',
  });
});
