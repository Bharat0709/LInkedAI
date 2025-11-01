const cron = require('node-cron');
const creditExpiryService = require('../services/CreditsExpiry/CreditsExpiry');

exports.initCreditExpiryCronJobs = async () => {
  // Run every day at 2:00 AM to expire credits
  cron.schedule('0 2 * * *', async () => {
    console.log('Running daily credit expiry cron job...');
    try {
      await creditExpiryService.processExpiredCredits();
    } catch (error) {
      console.log('Credit expiry cron job failed:', error);
    }
  });

  console.log('Credit expiry cron jobs initialized');
};
