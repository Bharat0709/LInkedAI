const fs = require('fs');
const path = require('path');
const csv = require('csv-writer');
const Member = require('../models/members');
const { sendDailyStatsReport } = require('../admin/email/admin');

exports.generateAndSendStats = async () => {
  try {
    console.log('📊 Starting daily stats generation...');

    // Get simple stats
    const stats = await getSimpleStats();

    // Create CSV with all users
    const csvPath = await createUsersCSV();

    // Add CSV info to stats
    const csvData = fs.readFileSync(csvPath, 'utf8');
    const csvLines = csvData.split('\n').length - 1;
    stats.csvUserCount = csvLines;

    // Send email with CSV attachment
    await sendDailyStatsReport(stats, csvPath);

    // Clean up CSV file after sending
    setTimeout(() => {
      if (fs.existsSync(csvPath)) {
        fs.unlinkSync(csvPath);
        console.log('🗑️ CSV file cleaned up');
      }
    }, 5000); // Wait 5 seconds before cleanup to ensure email is sent

    console.log('✅ Stats report sent successfully with CSV attachment');
  } catch (error) {
    console.error('❌ Error sending stats:', error);
  }
};

const getSimpleStats = async () => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    // 1️⃣ Basic counts
    const totalUsers = await Member.countDocuments();
    const verifiedUsers = await Member.countDocuments({ isVerified: true });
    const gmailConnectedUsers = await Member.countDocuments({ 'gmailTokens.email': { $exists: true, $ne: '' } });

    // 2️⃣ New User Growth
    const newUsers24h = await Member.countDocuments({
      accountCreatedAt: { $gte: yesterday },
    });
    const newUsersWeek = await Member.countDocuments({
      accountCreatedAt: { $gte: lastWeek },
    });

    // 3️⃣ Activity / Retention
    const activeUsers24h = await Member.countDocuments({
      lastActive: { $gte: yesterday },
    });
    const retentionRate = totalUsers > 0 ? ((activeUsers24h / totalUsers) * 100).toFixed(1) : 0;

    // 4️⃣ Plan Stats
    const freePlanUsers = await Member.countDocuments({ plan: 'Free' });
    const premiumUsers = await Member.countDocuments({ plan: { $ne: 'Free' } });

    // 5️⃣ Aggregated Stats (credits, streaks, linkedin metrics, etc.)
    const aggregate = await Member.aggregate([
      {
        $group: {
          _id: null,
          totalCreditsUsed: { $sum: '$totalCreditsUsed' },
          avgDaysActive: { $avg: '$daysActive' },
          avgCurrentStreak: { $avg: '$currentStreak' },
          totalFollowers: { $sum: '$followersCount' },
          totalConnections: { $sum: '$connectionsCount' },
        },
      },
    ]);

    return {
      reportDate: now.toDateString(),
      reportTime: now.toLocaleTimeString(),

      // User Stats
      totalUsers,
      verifiedUsers,
      gmailConnectedUsers,
      newUsers24h,
      newUsersWeek,
      activeUsers24h,
      retentionRate,

      // Plan Stats
      freePlanUsers,
      premiumUsers,

      // Aggregates
      totalCreditsUsed: aggregate[0]?.totalCreditsUsed || 0,
      avgDaysActive: Math.round(aggregate[0]?.avgDaysActive || 0),
      avgCurrentStreak: Math.round(aggregate[0]?.avgCurrentStreak || 0),
      totalFollowers: aggregate[0]?.totalFollowers || 0,
      totalConnections: aggregate[0]?.totalConnections || 0,
    };
  } catch (error) {
    console.error('Error generating stats:', error);
    throw error;
  }
};

const createUsersCSV = async () => {
  const timestamp = new Date().toISOString().split('T')[0];
  const csvDir = path.join(__dirname, '../temp');

  // Ensure directory exists
  if (!fs.existsSync(csvDir)) {
    fs.mkdirSync(csvDir, { recursive: true });
  }

  const csvPath = path.join(csvDir, `all-users-${timestamp}.csv`);

  // Get all users
  const users = await Member.find({})
    .select('name email plan credits totalCreditsUsed daysActive currentStreak accountCreatedAt lastActive profileLink timeZone role active leaderBoardProfileVisibility')
    .sort({ totalCreditsUsed: -1 });

  // Create CSV writer
  const csvWriter = csv.createObjectCsvWriter({
    path: csvPath,
    header: [
      { id: 'name', title: 'Name' },
      { id: 'email', title: 'Email' },
      { id: 'profileLink', title: 'Profile Link' },
      { id: 'lastActive', title: 'Last Active' },
      { id: 'daysActive', title: 'Days Active' },
      { id: 'totalCreditsUsed', title: 'Total Credits Used' },
      { id: 'timeZone', title: 'Time Zone' },
      { id: 'currentStreak', title: 'Current Streak' },
      { id: 'leaderBoardVisible', title: 'Leaderboard Visible' },
      { id: 'active', title: 'Active' },
      { id: 'credits', title: 'Credits Available' },
      { id: 'accountCreated', title: 'Account Created' },
      { id: 'role', title: 'Role' },
      { id: 'plan', title: 'Plan' },
    ],
  });

  // Format data
  const csvData = users.map(user => ({
    name: user.name || 'N/A',
    email: user.email || 'N/A',
    daysActive: user.daysActive || 0,
    profileLink: user.profileLink || 'N/A',
    timeZone: user.timeZone || 'N/A',
    totalCreditsUsed: user.totalCreditsUsed || 0,
    active: user.active ? 'Yes' : 'No',
    credits: user.credits || 0,
    role: user.role || 'N/A',
    currentStreak: user.currentStreak || 0,
    plan: user.plan || 'Free',
    leaderBoardVisible: user.leaderBoardProfileVisibility ? 'Yes' : 'No',
    accountCreated: user.accountCreatedAt ? user.accountCreatedAt.toISOString().split('T')[0] : 'N/A',
    lastActive: user.lastActive ? user.lastActive.toISOString().split('T')[0] : 'N/A',
  }));

  await csvWriter.writeRecords(csvData);
  console.log(`📄 CSV created with ${csvData.length} users: ${csvPath}`);

  return csvPath;
};
