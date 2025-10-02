const creditRepository = require('../../repositories/creditsRepository');

const processExpiredCredits = async () => {
  try {
    console.log('Starting credit expiry process...');

    const organizations = await creditRepository.findOrganizationsWithExpiredCredits();

    if (organizations.length === 0) {
      console.log('No expired credits found');
      return {
        success: true,
        processedCount: 0,
        results: [],
      };
    }

    console.log(`Found ${organizations.length} organizations with expired credits`);

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const org of organizations) {
      try {
        const result = await creditRepository.expireCreditsForOrganization(org._id);

        if (result) {
          results.push(result);
          successCount++;
          console.log(`Expired ${result.expiredAmount} credits for organization ${result.email}`);
        }
      } catch (error) {
        failureCount++;
        console.log(`Failed to expire credits for organization ${org._id}:`, error);
        results.push({
          organizationId: org._id,
          email: org.email,
          error: error.message,
        });
      }
    }

    console.log(`Credit expiry process completed. Success: ${successCount}, Failed: ${failureCount}`);

    return {
      success: true,
      processedCount: successCount,
      failedCount: failureCount,
      results,
    };
  } catch (error) {
    console.log('Error in credit expiry process:', error);
    throw error;
  }
};

const getExpiryStats = async () => {
  try {
    return await creditRepository.getCreditExpiryStats();
  } catch (error) {
    console.log('Error fetching credit expiry stats:', error);
    throw error;
  }
};

const sendExpiryNotifications = async (daysBeforeExpiry = 3) => {
  try {
    console.log(`Checking for credits expiring in ${daysBeforeExpiry} days...`);

    const organizations = await creditRepository.findOrganizationsWithCreditsExpiringSoon(daysBeforeExpiry);

    if (organizations.length === 0) {
      console.log('No organizations with credits expiring soon');
      return {
        success: true,
        notificationsSent: 0,
      };
    }

    console.log(`Found ${organizations.length} organizations with credits expiring soon`);

    // TODO: Integrate with your email service
    // const emailService = require('./emailService');

    let notificationsSent = 0;

    for (const org of organizations) {
      try {
        const daysLeft = Math.ceil((org.credits.expiresAt - new Date()) / (1000 * 60 * 60 * 24));

        // TODO: Send email notification
        // await emailService.sendCreditExpiryNotification({
        //   email: org.email,
        //   name: org.name,
        //   creditsBalance: org.credits.balance,
        //   expiresAt: org.credits.expiresAt,
        //   daysLeft,
        // });

        notificationsSent++;
        console.log(`Sent expiry notification to ${org.email} (${org.credits.balance} credits, ${daysLeft} days left)`);
      } catch (error) {
        console.log(`Failed to send notification to ${org.email}:`, error);
      }
    }

    console.log(`Expiry notifications completed. Sent: ${notificationsSent}`);

    return {
      success: true,
      notificationsSent,
      totalOrganizations: organizations.length,
    };
  } catch (error) {
    console.log('Error sending expiry notifications:', error);
    throw error;
  }
};

module.exports = {
  processExpiredCredits,
  getExpiryStats,
  sendExpiryNotifications,
};
