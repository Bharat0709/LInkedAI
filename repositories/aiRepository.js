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

const updateMemberCredits = async (memberId, creditsUsed) => {
  const member = await memberRepo.findById(memberId);
  if (!member) {
    throw new Error('Member not found');
  }

  const newCredits = member.creditsLeft - creditsUsed;
  if (newCredits < 0) {
    throw new Error('Insufficient credits');
  }

  const updateData = {
    creditsLeft: newCredits,
    totalCreditsUsed: (member.totalCreditsUsed || 0) + creditsUsed,
  };

  return await memberRepo.updateById(memberId, updateData);
};

const updateOrganizationCredits = async (organizationId, creditsUsed) => {
  const organization = await organizationRepo.findById(organizationId);
  if (!organization) {
    throw new Error('Organization not found');
  }

  const newCredits = organization.credits - creditsUsed;
  if (newCredits < 0) {
    throw new Error('Insufficient credits');
  }

  const updateData = {
    credits: newCredits,
    totalCreditsUsed: (organization.totalCreditsUsed || 0) + creditsUsed,
    lastActive: new Date(),
  };

  return await organizationRepo.updateById(organizationId, updateData);
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
  return (organization.credits || 0) >= requiredCredits;
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

const getOrganizationCredits = async organizationId => {
  const organization = await organizationRepo.findById(organizationId);
  if (!organization) {
    throw new Error('Organization not found');
  }
  return {
    credits: organization.credits || 0,
    totalCreditsUsed: organization.totalCreditsUsed || 0,
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
  getOrganizationCredits,

  // Aggregated data fetch
  getMembersByOrganizationWithCredits,
};
