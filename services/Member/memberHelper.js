const memberRepository = require('../../repositories/memberRepository');
const organizationRepository = require('../../repositories/organizationRepository');

const logMemberActivity = async (memberId, action, metadata = {}) => {
  try {
    const member = await memberRepository.findById(memberId);
    if (!member) return;

    const organization = await organizationRepository.findById(member.organizationId);
    if (!organization) return;

    const logEntry = {
      action,
      timestamp: new Date(),
      metadata: {
        memberId,
        memberName: member.name,
        memberEmail: member.email,
        ...metadata,
      },
    };

    await organizationRepository.addToActivityLog(member.organizationId, logEntry);
  } catch (error) {
    console.error('Error logging member activity:', error);
  }
};

const calculateMemberRank = async memberId => {
  try {
    const member = await memberRepository.findById(memberId);
    if (!member) return 0;

    const allMembers = await memberRepository.findAllSortedByDaysActive();
    const rank = allMembers.findIndex(m => m.daysActive === member.daysActive) + 1;

    return rank;
  } catch (error) {
    console.error('Error calculating member rank:', error);
    return 0;
  }
};

const getMemberPlanFeatures = async memberId => {
  try {
    const member = await memberRepository.findById(memberId);
    if (!member) return null;

    const organization = await organizationRepository.findById(member.organizationId);
    if (!organization) return null;

    return {
      aiModels: organization.planFeatures.aiModels,
      hasPrioritySupport: organization.planFeatures.hasPrioritySupport,
      canBuyCredits: organization.planFeatures.canBuyCredits,
      hasCustomAIComments: member.hasCustomAIComments,
      subscriptionPlan: organization.subscription.plan,
      memberRole: member.role,
    };
  } catch (error) {
    console.error('Error getting member plan features:', error);
    return null;
  }
};

const checkMemberPermissions = async (memberId, requiredRole = 'member') => {
  try {
    const member = await memberRepository.findById(memberId);
    if (!member) return false;

    const roleHierarchy = {
      member: 1,
      profile: 2,
      admin: 3,
      owner: 4,
    };

    return roleHierarchy[member.role] >= roleHierarchy[requiredRole];
  } catch (error) {
    console.error('Error checking member permissions:', error);
    return false;
  }
};

const validateMemberData = memberData => {
  const errors = [];

  if (!memberData.name || memberData.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (!memberData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memberData.email)) {
    errors.push('Valid email is required');
  }

  if (memberData.profileLink && !/^https?:\/\/.+/.test(memberData.profileLink)) {
    errors.push('Profile link must be a valid URL');
  }

  if (memberData.role && !['member', 'profile', 'admin', 'owner'].includes(memberData.role)) {
    errors.push('Invalid role specified');
  }

  return errors;
};

const getMemberStats = async memberId => {
  try {
    const member = await memberRepository.findById(memberId);
    if (!member) return null;

    const rank = await calculateMemberRank(memberId);
    const planFeatures = await getMemberPlanFeatures(memberId);

    return {
      memberId: member._id,
      name: member.name,
      email: member.email,
      daysActive: member.daysActive,
      currentStreak: member.currentStreak,
      totalCreditsUsed: member.totalCreditsUsed,
      creditsLeft: member.creditsLeft,
      rank,
      planFeatures,
      lastActive: member.lastActive,
      profileViews: member.profileViews,
      connectionsCount: member.connectionsCount,
      isLinkedinConnected: member.isLinkedinConnected,
    };
  } catch (error) {
    console.error('Error getting member stats:', error);
    return null;
  }
};

const parseConnectionToken = token => {
  const [orgId, memId] = token.split('-');
  return { orgId, memId };
};

const resetDailyCredits = async memberId => {
  const member = await memberRepository.findById(memberId);
  if (!member) {
    throw new AppError('Member not found', 404);
  }

  const organization = await organizationRepository.findById(member.organizationId);
  if (!organization) {
    throw new AppError('Organization not found', 404);
  }

  const savedCreditsLimit = member.creditLimitperDay;
  const savedOrganizationCreditsLimit = organization.planUsage.dailyUsage.aiCreditsUsedToday.maxextensionCreditsperDay;

  if (savedCreditsLimit !== savedOrganizationCreditsLimit) {
    throw new AppError('Credit Limit mismatch found', 404);
  }

  const creditsLeft = organization.planUsage.dailyUsage.aiCreditsUsedToday.maxextensionCreditsperDay;

  // Update member's credit limit and reset daily credits
  await memberRepository.updateById(memberId, {
    creditsLeft: creditsLeft,
  });

  return creditsLeft;
};

module.exports = {
  logMemberActivity,
  calculateMemberRank,
  getMemberPlanFeatures,
  checkMemberPermissions,
  resetDailyCredits,
  validateMemberData,
  getMemberStats,
  resetDailyCredits,
  parseConnectionToken,
};
