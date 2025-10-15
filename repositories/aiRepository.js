// repositories/aiRepository.js
const memberRepo = require('./memberRepository');
const organizationRepo = require('./organizationRepository');

// Use existing member repository methods
const findMemberById = async memberId => {
  return await memberRepo.findById(memberId);
};

const findOrganizationById = async organizationId => {
  return await organizationRepo.findById(organizationId);
};

const updateMemberCredits = async (memberId, { creditsUsedToday, lastActive, totalCreditsUsed }) => {
  const update = {
    creditsUsedToday,
  };

  if (totalCreditsUsed !== undefined) {
    update.totalCreditsUsed = totalCreditsUsed;
  }

  const updatedMember = await memberRepo.updateById(memberId, update);
  return updatedMember;
};
const updateOrganizationCredits = async (orgId, { balance, totalUsed, transaction }) => {
  const update = {
    'credits.balance': balance,
    'credits.totalUsed': totalUsed,
  };

  if (transaction) {
    update.$push = { 'credits.transactions': transaction };
  }

  update.lastActive = new Date();

  const updatedOrg = await organizationRepo.updateById(orgId, update);
  return updatedOrg;
};

const checkMemberCredits = async (memberId, requiredCredits) => {
  const member = await memberRepo.findById(memberId);
  if (!member) {
    throw new Error('Member not found');
  }
  return (member.creditsLeft || 0) >= requiredCredits;
};

const checkOrganizationCredits = async (organizationId, requiredCredits) => {
  const organization = await organizationRepo.findById(organizationId);
  if (!organization) {
    throw new Error('Organization not found');
  }
  return organization.planUsage.dailyUsage.aiCreditsUsedToday.viralPostGenerator >= requiredCredits;
};

const getMemberCredits = async memberId => {
  const member = await memberRepo.findById(memberId);
  if (!member) {
    throw new Error('Member not found');
  }
  return {
    creditsLeft: member.creditsLeft || 0,
    totalCreditsUsed: member.totalCreditsUsed || 0,
  };
};

const getMembersByOrganizationWithCredits = async organizationId => {
  const members = await memberRepo.findByOrganizationId(organizationId);
  return members.map(member => ({
    id: member._id,
    name: member.name,
    email: member.email,
    creditsLeft: member.creditsLeft || 0,
    totalCreditsUsed: member.totalCreditsUsed || 0,
    lastActive: member.lastActive,
  }));
};

module.exports = {
  // Member and Organization lookup
  findMemberById,
  findOrganizationById,

  // Individual credit updates
  updateMemberCredits,
  updateOrganizationCredits,

  // Credit checks
  checkMemberCredits,
  checkOrganizationCredits,

  // Credit getters
  getMemberCredits,

  // Aggregated data fetch
  getMembersByOrganizationWithCredits,
};
