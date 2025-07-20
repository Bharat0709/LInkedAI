const memberRepository = require('../../repositories/memberRepository');
const organizationRepository = require('../../repositories/organizationRepository');
const { generateConnectionToken } = require('../../utils/randomString');
const { sendNewMemberInviteEmail, sendMilestoneEmail } = require('../email/member');
const { logMemberActivity, parseConnectionToken, resetDailyCredits } = require('./memberHelper');
const AppError = require('../../utils/appError');
// const OldUser = require('../../models/oldUser');

const checkMemberExists = async (name, profileLink) => {
  try {
    if (!name || !profileLink) {
      return res.status(400).json({ error: 'Name and profile link are required' });
    }

    const existingMember = await memberRepository.findByNameAndProfileLink(name, profileLink);

    return (exists = !!(existingMember && existingMember.email));
  } catch (error) {
    console.error('checkMemberExists error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const createMember = async (organizationId, memberData) => {
  const { name, email, timeZone } = memberData;
  console.log(organizationId, memberData);

  if (!name || !email) {
    throw new AppError('Name and email are required', 400);
  }

  const organization = await organizationRepository.findById(organizationId);
  if (!organization) {
    throw new AppError('Organization does not exist', 400);
  }

  const existingMember = await memberRepository.findByEmail(email);
  if (existingMember) {
    throw new AppError('Member already exists with this email', 400);
  }

  // Check member limit based on organization's plan
  const currentMemberCount = await memberRepository.countByOrganizationId(organizationId);
  console.log('CURRENT MEMBER COUNT', currentMemberCount, organization.planUsage.maxMembers);
  if (currentMemberCount >= organization.planUsage.maxMembers) {
    throw new AppError('Member limit reached for your current plan', 403);
  }

  const connectionToken = generateConnectionToken(organizationId);

  const newMemberData = {
    name,
    email,
    timeZone: timeZone || 'Asia/Calcutta',
    organizationId: organizationId.toString(),
    plan: organization.subscription.plan,
    planStatus: organization.subscription.status,
    creditsLeft: organization.planUsage.dailyUsage.aiCreditsUsedToday.maxextensionCreditsperDay,
    creditLimitperDay: organization.planUsage.dailyUsage.aiCreditsUsedToday.maxextensionCreditsperDay,
    connectionToken,
    role: organization.email === email ? 'self' : 'member',
  };

  const member = await memberRepository.create(newMemberData);

  member.connectionToken = generateConnectionToken(organizationId, member._id);
  await memberRepository.updateById(member._id, { connectionToken: member.connectionToken });
  await organizationRepository.updateById(organizationId, {
    $inc: { 'planUsage.currentMemberCount': 1 },
  });

  await logMemberActivity(member._id, 'member_created', {
    organizationId,
    createdAt: new Date(),
  });

  sendNewMemberInviteEmail(organization.name, name, email, member.connectionToken);

  return member;
};

const connectMember = async ({ connectionToken, name, profileLink, profilePicture, email }) => {
  if (!connectionToken || !name || !profileLink || !profilePicture || !email) {
    throw new AppError('All fields are required', 400);
  }

  const { orgId, memId } = parseConnectionToken(connectionToken);

  const organization = await organizationRepository.findById(orgId);
  if (!organization) throw new AppError('Organization not found', 404);

  const member = await memberRepository.findByIdAndOrg(memId, orgId);

  const verifyEmail = await memberRepository.findByEmail(email);

  if (!member || !verifyEmail) throw new AppError('Member not found', 404);

  // 3. Token match & status checks
  if (connectionToken !== member.connectionToken) throw new AppError('Invalid connection token', 400);

  if (member.isConnected === 'connected') {
    return member;
  }

  const memberData = {
    isConnected: 'connected',
    name,
    profileLink,
    profilePicture,
  };

  await memberRepository.updateById(member._id, memberData);

  // Log activity
  await logMemberActivity(member._id, 'member_connected_extension', {
    orgId,
    createdAt: new Date(),
  });

  sendNewUserEmail(member);
  sendExtensionConnectedConfirmation(member);

  return member;
};

const findAllByOrganizationId = async organizationId => {
  try {
    // Validate input
    if (!organizationId) {
      throw new AppError('Organization ID is required', 401);
    }

    // Find all members associated with the organization
    const members = await memberRepository.findAllByOrganizationId(organizationId);

    return members;
  } catch (error) {
    console.error('Error finding members by organization ID:', error);
    throw error;
  }
};

const updateLeaderboardVisibility = async (memberId, visibility) => {
  const member = await memberRepository.findById(memberId);
  if (!member) {
    throw new AppError('Member not found', 404);
  }

  const updatedMember = await memberRepository.updateById(memberId, {
    leaderBoardProfileVisibility: visibility,
  });

  // Log activity
  await logMemberActivity(memberId, 'leaderboard_visibility_updated', {
    visibility,
  });

  return updatedMember;
};

const getLeaderboard = async memberId => {
  const member = await memberRepository.findById(memberId);
  if (!member) {
    throw new AppError('Member not found', 404);
  }

  const topUsers = await memberRepository.findLeaderboard(20);
  const allUsers = await memberRepository.findAllSortedByDaysActive();

  const userRank = allUsers.findIndex(u => u.daysActive === member.daysActive) + 1;

  return {
    member,
    rank: userRank,
    leaderboard: topUsers,
  };
};

const getMemberById = async memberId => {
  const member = await memberRepository.findById(memberId);
  if (!member) {
    throw new AppError('Member not found', 404);
  }
  return member;
};

const updateMemberProfile = async (memberId, profileData) => {
  const member = await memberRepository.findById(memberId);
  if (!member) {
    throw new AppError('Member not found', 404);
  }

  const updatedMember = await memberRepository.updateProfile(memberId, profileData);

  // Log activity
  await logMemberActivity(memberId, 'profile_updated', {
    updatedFields: Object.keys(profileData),
  });

  return updatedMember;
};

const consumeCredits = async (memberId, creditsToConsume) => {
  const member = await memberRepository.findById(memberId);
  if (!member) {
    throw new AppError('Member not found', 404);
  }

  if (member.creditsLeft < creditsToConsume) {
    throw new AppError('Insufficient credits', 403);
  }

  const newCreditsLeft = member.creditsLeft - creditsToConsume;
  const newTotalCreditsUsed = member.totalCreditsUsed + creditsToConsume;

  await memberRepository.updateById(memberId, {
    creditsLeft: newCreditsLeft,
    totalCreditsUsed: newTotalCreditsUsed,
  });

  // Log activity
  await logMemberActivity(memberId, 'credits_consumed', {
    creditsConsumed: creditsToConsume,
    creditsLeft: newCreditsLeft,
    totalCreditsUsed: newTotalCreditsUsed,
  });

  return await memberRepository.findById(memberId);
};

const deleteMember = async (memberId, softDelete = true) => {
  const member = await memberRepository.findById(memberId);
  if (!member) {
    throw new AppError('Member not found', 404);
  }

  let result;
  if (softDelete) {
    result = await memberRepository.softDelete(memberId);
    await logMemberActivity(memberId, 'member_soft_deleted', {
      deletedAt: new Date(),
    });
  } else {
    result = await memberRepository.deleteMember(memberId);
  }

  return result;
};

const updateDaysActive = async (memberId, activeDays) => {
  const member = await memberRepository.findById(memberId);
  if (!member) {
    throw new AppError('Member not found', 404);
  }

  // Verify the provided activeDays matches the member's current daysActive
  if (member.daysActive !== activeDays) {
    throw new AppError(`Days active mismatch. Expected: ${member.daysActive}, Provided: ${activeDays}`, 400);
  }

  const today = new Date();
  const lastActiveDate = new Date(member.lastActive);

  today.setHours(0, 0, 0, 0);
  lastActiveDate.setHours(0, 0, 0, 0);

  if (lastActiveDate >= today) {
    const updateData = {
      lastActive: new Date(),
    };

    await memberRepository.updateById(memberId, updateData);
    return await memberRepository.findById(memberId);
  }

  // Get organization and check subscription status
  const organization = await organizationRepository.findById(member.organizationId);
  if (!organization) {
    throw new AppError('Organization not found', 404);
  }

  // Check if organization subscription is active
  if (!organization.subscription.plan || organization.subscription.status === 'expired' || organization.subscription.status === 'inactive') {
    throw new AppError('Organization subscription is not active', 403);
  }

  // Reset daily credits based on organization's plan
  const newCreditsLeft = await resetDailyCredits(memberId);

  // Increment days active by 1
  const newDaysActive = activeDays + 1;

  // Update member data
  const updateData = {
    lastActive: new Date(),
    daysActive: newDaysActive,
    creditsLeft: newCreditsLeft,
  };

  await memberRepository.updateById(memberId, updateData);

  // Send milestone email if applicable (check with new days active count)
  const isMilestone = newDaysActive % 10 === 0;
  if (isMilestone) {
    try {
      await sendMilestoneEmail({
        name: member.name,
        email: member.email,
        daysActive: newDaysActive,
      });
    } catch (error) {
      console.error('Failed to send milestone email:', error);
    }
  }

  // Log activity
  await logMemberActivity(memberId, 'days_active_updated', {
    activeDays: newDaysActive,
    previousDaysActive: activeDays,
    isMilestone,
    newCreditLimit,
  });

  return await memberRepository.findById(memberId);
};

const findLeaderboard = async (limit = 20) => {
  return await Member.find(
    {
      leaderBoardProfileVisibility: true,
      isConnected: 'connected',
      active: true,
    },
    {
      name: 1,
      profileLink: 1,
      profilePicture: 1,
      daysActive: 1,
      leaderBoardProfileVisibility: 1,
    }
  )
    .sort({ daysActive: -1 })
    .limit(limit);
};

const findAllSortedByDaysActive = async () => {
  return await Member.find(
    {
      active: true,
      isConnected: 'connected',
    },
    {
      _id: 1,
      daysActive: 1,
    }
  ).sort({ daysActive: -1 });
};

const updateMemberProfileStats = async (memberId, organizationId, memberDetails) => {
  const { firstName, lastName, ...otherDetails } = memberDetails;

  // Validate required fields
  if (!firstName || !lastName) {
    throw new AppError('First name and last name are required', 400);
  }

  // Validate member and organization
  const [organization, member] = await Promise.all([organizationRepository.findById(organizationId), memberRepository.findById(memberId)]);

  if (!organization) {
    throw new AppError('Organization not found', 404);
  }

  if (!member || member.organizationId.toString() !== organizationId.toString()) {
    throw new AppError('Member not found or does not belong to the organization', 404);
  }

  // Prepare update data
  const fullName = `${firstName} ${lastName}`;
  const updateData = {
    name: fullName,
    connectionsCount: otherDetails.connectionsCount,
    profileViews: otherDetails.profileViews,
    followersCount: otherDetails.followersCount,
    followingCount: otherDetails.followingCount,
    searchAppearances: otherDetails.searchAppearances,
    completedProfileAspects: otherDetails.completedAspects,
    missingProfileAspects: otherDetails.missingAspects,
    stepsToCompleteProfile: otherDetails.stepsToCompleteProfile,
  };

  // Update member details
  const updatedMember = await memberRepository.updateMemberProfileStats(memberId, updateData, member.timeZone);

  if (!updatedMember) {
    throw new AppError('Failed to update member details', 500);
  }

  // Log activity
  await logMemberActivity(memberId, 'member_profile_stats_updated', {
    updatedFields: Object.keys(updateData),
    organizationId,
  });

  return updatedMember;
};

module.exports = {
  checkMemberExists,
  createMember,
  findAllByOrganizationId,
  findAllSortedByDaysActive,
  findLeaderboard,
  updateDaysActive,
  updateLeaderboardVisibility,
  updateMemberProfileStats,
  getLeaderboard,
  getMemberById,
  connectMember,
  updateMemberProfile,
  consumeCredits,
  deleteMember,
};
