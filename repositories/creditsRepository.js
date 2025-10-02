const orgRepo = require('./organizationRepository');
const Organization = require('../models/organization');

const findOrganizationsWithExpiredCredits = async () => {
  return await Organization.find({
    'credits.expiresAt': { $lt: new Date() },
    'credits.balance': { $gt: 0 },
    deletedAt: null,
  }).select('email name credits');
};

const expireCreditsForOrganization = async organizationId => {
  const org = await orgRepo.findById(organizationId);
  if (!org) {
    throw new Error('Organization not found');
  }

  if (org.areCreditsExpired() && org.credits.balance > 0) {
    const expiredAmount = org.credits.balance;

    org.credits.transactions.push({
      type: 'expiry',
      amount: -expiredAmount,
      balance: 0,
      description: `Credits expired on ${org.credits.expiresAt.toDateString()}`,
      createdAt: new Date(),
    });

    org.credits.balance = 0;
    await orgRepo.updateById(organizationId, { credits: org.credits });

    return {
      organizationId: org._id,
      email: org.email,
      expiredAmount,
      expiredAt: org.credits.expiresAt,
    };
  }

  return null;
};

const getCreditExpiryStats = async () => {
  const now = new Date();
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [expired, expiringSoon, expiringInWeek] = await Promise.all([
    Organization.countDocuments({
      'credits.expiresAt': { $lt: now },
      'credits.balance': { $gt: 0 },
      deletedAt: null,
    }),
    Organization.countDocuments({
      'credits.expiresAt': { $gte: now, $lt: oneDayFromNow },
      'credits.balance': { $gt: 0 },
      deletedAt: null,
    }),
    Organization.countDocuments({
      'credits.expiresAt': { $gte: now, $lt: sevenDaysFromNow },
      'credits.balance': { $gt: 0 },
      deletedAt: null,
    }),
  ]);

  return {
    expired,
    expiringSoon,
    expiringInWeek,
  };
};

const findOrganizationsWithCreditsExpiringSoon = async (daysBeforeExpiry = 3) => {
  const now = new Date();
  const expiryDate = new Date(now.getTime() + daysBeforeExpiry * 24 * 60 * 60 * 1000);

  return await Organization.find({
    'credits.expiresAt': { $gte: now, $lt: expiryDate },
    'credits.balance': { $gt: 0 },
    deletedAt: null,
  }).select('email name credits');
};

module.exports = {
  findOrganizationsWithExpiredCredits,
  expireCreditsForOrganization,
  getCreditExpiryStats,
  findOrganizationsWithCreditsExpiringSoon,
};
