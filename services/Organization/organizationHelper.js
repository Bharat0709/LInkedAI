const organizationRepository = require('../../repositories/organizationRepository');

const getTrialStatus = organization => {
  const now = new Date();
  const trialEndDate = organization.subscription.trialEndDate;

  if (organization.subscription.status !== 'trial') {
    return {
      isInTrial: false,
      trialExpired: false,
      daysRemaining: 0,
    };
  }

  const isInTrial = now < trialEndDate;
  const daysRemaining = Math.max(0, Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24)));

  return {
    isInTrial,
    trialExpired: !isInTrial,
    daysRemaining,
    trialEndDate,
  };
};

const logActivity = async (organizationId, action, metadata) => {
  try {
    const logEntry = {
      action,
      timestamp: new Date(),
      metadata,
    };

    await organizationRepository.addToActivityLog(organizationId, logEntry);
  } catch (error) {
    // Log error but don't throw - activity logging shouldn't break main flow
    console.error('Failed to log activity:', error);
  }
};

const checkAndUpdateTrialStatus = async organizationId => {
  const organization = await organizationRepository.findById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found.', 404);
  }

  const trialStatus = getTrialStatus(organization);

  if (trialStatus.trialExpired && organization.subscription.status === 'trial') {
    // Update subscription status to expired
    await organizationRepository.updateById(organizationId, {
      'subscription.status': 'expired',
    });

    await logActivity(organizationId, 'trial_expired', {
      expiredAt: new Date(),
      trialEndDate: organization.subscription.trialEndDate,
    });

    return { ...trialStatus, statusUpdated: true };
  }

  return trialStatus;
};

module.exports = {
  getTrialStatus,
  logActivity,
  checkAndUpdateTrialStatus,
};
