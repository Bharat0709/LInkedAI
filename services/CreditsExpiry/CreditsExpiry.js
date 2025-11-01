const { sendCreditsExpiringNotification } = require('../../admin/email/admin');
const creditRepository = require('../../repositories/creditsRepository');

const processExpiredCredits = async () => {
  try {
    const organizations = await creditRepository.findOrganizationsWithExpiredCredits();

    if (organizations.length === 0) {
      return {
        success: true,
        processedCount: 0,
        results: [],
      };
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const org of organizations) {
      try {
        const result = await creditRepository.expireCreditsForOrganization(org._id);
        if (result) {
          results.push(result);
          successCount++;
        }
      } catch (error) {
        failureCount++;
        results.push({
          organizationId: org._id,
          email: org.email,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      processedCount: successCount,
      failedCount: failureCount,
      results,
    };
  } catch (error) {
    throw error;
  }
};

const getExpiryStats = async () => {
  try {
    return await creditRepository.getCreditExpiryStats();
  } catch (error) {
    throw error;
  }
};

const sendExpiryNotifications = async (daysBeforeExpiry = 3) => {
  try {
    const organizations = await creditRepository.findOrganizationsWithCreditsExpiringSoon(daysBeforeExpiry);

    if (organizations.length === 0) {
      return {
        success: true,
        notificationsSent: 0,
      };
    }

    let notificationsSent = 0;

    for (const org of organizations) {
      try {
        const daysLeft = Math.ceil((org.credits.expiresAt - new Date()) / (1000 * 60 * 60 * 24));
        console.log(`Sending notification to ${org.email} for credits expiring in ${daysLeft} days.`);
        // TODO: Send email notification
        await sendCreditsExpiringNotification({
          org,
          creditsLeft: org.credits.balance,
          expiresAt: org.credits.expiresAt,
        });

        notificationsSent++;
      } catch (error) {
        console.log(`Failed to send notification to ${org.email}:`, error);
      }
    }

    return {
      success: true,
      notificationsSent,
      totalOrganizations: organizations.length,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  processExpiredCredits,
  getExpiryStats,
  sendExpiryNotifications,
};
