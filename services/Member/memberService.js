const memberRepository = require('../../repositories/memberRepository');
const organizationRepository = require('../../repositories/organizationRepository');
const aiRepository = require('../../repositories/aiRepository');
const { generateConnectionToken } = require('../../utils/randomString');
const { sendNewMemberInviteEmail, sendMilestoneEmail} = require('../../admin/email/member');
const { logMemberActivity, parseConnectionToken, validateUpdateFields } = require('./memberHelper');
const AppError = require('../../utils/appError');
const OldMember = require('../../models/OldMember');
const { sendNewUserEmail } = require('../../admin/email/admin');

const checkMemberExists = async (name, profileLink) => {
  try {
    if (!name || !profileLink) {
      return res.status(400).json({ error: 'Name and profile link are required' });
    }

    const existingMember = await memberRepository.findByNameAndProfileLink(name, profileLink);

    return (exists = !!(existingMember && existingMember.email));
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const createMember = async (organizationId, memberData) => {
  const { name, email, timeZone } = memberData;

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

  const connectionToken = generateConnectionToken(organizationId);
  // 🧠 Check in old DB if this member existed
  const oldMember = await OldMember.findOne({ email });
  const newMemberData = {
    name,
    email,
    timeZone: timeZone || 'Asia/Calcutta',
    organizationId: organizationId.toString(),
    creditsLeft: organization.credits.balance,
    connectionToken,
    role: organization.email === email ? 'self' : 'member',
    daysActive: oldMember ? oldMember.daysActive : 0,
    totalCreditsUsed: oldMember ? oldMember.totalCreditsUsed : 0,
  };

  const member = await memberRepository.create(newMemberData);

  member.connectionToken = generateConnectionToken(organizationId, member._id);
  await memberRepository.updateById(member._id, { connectionToken: member.connectionToken });
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

  await sendNewUserEmail(member);
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

const updateCreditsUsedToday = async (memberId, organizationId) => {
  const member = await memberRepository.findById(memberId);
  if (!member) {
    throw new AppError('Member not found', 404);
  }
  const organization = await organizationRepository.findById(organizationId);
  if (!member) throw new AppError('Member not found', 404);
  if (!organization) throw new AppError('Organization not found', 404);
  if (member.creditsUsedToday === 0) {
    throw new AppError('No Credits used by member today');
  }
  if (organization.credits.balance < 10) {
    throw new AppError('Insuffient Credits to perfom this action', 403);
  }

  const newOrgBalance = organization.credits.balance - 10;

  const orgTransaction = {
    type: 'usage',
    amount: 10,
    balance: newOrgBalance,
    description: `Credits used by member ${member.name} for Resetting Credit used for ${new Date().toLocaleString()}`,
    createdAt: new Date(),
  };

  await aiRepository.updateOrganizationCredits(organization._id, {
    balance: newOrgBalance,
    totalUsed: organization.credits.totalUsed + 10,
    transaction: orgTransaction,
  });

  member.creditsUsedToday = 0;
  member.totalCreditsUsed += 10;
  const updatedMember = await aiRepository.updateMemberCredits(member._id, {
    totalCreditsUsed: member.totalCreditsUsed,
    creditsUsedToday: member.creditsUsedToday,
  });

  // Log activity
  await logMemberActivity(memberId, `Credits Reset Perfomed for ${new Date().toLocaleString()}`);

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

const getMemberWithOrganizationDetails = async memberId => {
  // Fetch member
  const member = await memberRepository.findById(memberId);
  if (!member) {
    throw new AppError('Member not found', 404);
  }

  // Fetch organization details separately
  const organization = await organizationRepository.findById(member.organizationId);
  if (!organization) {
    throw new AppError('Organization not found', 404);
  }

  // Return combined response
  const memberData = {
    ...member.toObject(),
    organization: {
      id: organization._id,
      name: organization.name,
      email: organization.email,
      creditsLeft: organization.credits.balance,
    },
  };
  return memberData;
};

const getMemberByIdAndOrg = async (memberId, organizationId) => {
  // Verify organization exists
  const organization = await organizationRepository.findById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found', 404);
  }

  // Find member and verify they belong to organization
  const member = await memberRepository.findByIdAndOrg(memberId, organizationId);
  if (!member) {
    throw new AppError('Member not found or does not belong to the organization', 404);
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

const deleteMember = async (memberId, softDelete = false) => {
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
    ``;
    const updateData = {
      lastActive: new Date(),
      creditsUsedToday: 0,
    };

    await memberRepository.updateById(memberId, updateData);
  }

  // Increment days active by 1
  const newDaysActive = activeDays + 1;

  // Update member data
  const updateData = {
    lastActive: new Date(),
    daysActive: newDaysActive,
    creditsUsedToday: 0,
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

const updateMemberSettings = async (memberId, organizationId, settingsData) => {
  const { timeZone, postSavingPreferences } = settingsData;

  // Verify organization exists
  const existingOrganization = await organizationRepository.findById(organizationId);
  if (!existingOrganization) {
    throw new AppError('Organization not found', 404);
  }

  // Verify member exists and belongs to organization
  const existingMember = await memberRepository.findById(memberId);
  if (!existingMember || existingMember.organizationId.toString() !== organizationId.toString()) {
    throw new AppError('Member not found or does not belong to the organization', 404);
  }

  // Prepare update object
  const updateFields = {};

  if (timeZone) updateFields.timeZone = timeZone;

  if (postSavingPreferences) {
    updateFields.postSavingPreferences = {
      ...existingMember.postSavingPreferences,
      ...postSavingPreferences,
    };

    if (postSavingPreferences.keywords) {
      updateFields.postSavingPreferences.keywords = postSavingPreferences.keywords;
    }
    if (postSavingPreferences.excludeKeywords) {
      updateFields.postSavingPreferences.excludeKeywords = postSavingPreferences.excludeKeywords;
    }
    if (postSavingPreferences.customCategories) {
      updateFields.postSavingPreferences.customCategories = postSavingPreferences.customCategories;
    }
    if (postSavingPreferences.postTypes) {
      updateFields.postSavingPreferences.postTypes = postSavingPreferences.postTypes;
    }
  }

  if (Object.keys(updateFields).length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  return await memberRepository.updateSettings(memberId, updateFields);
};

// Update Member Summary Service
const updateMemberSummary = async (memberId, organizationId, summaryData) => {
  const { professionalProfile } = summaryData;

  // Verify organization exists
  const existingOrganization = await organizationRepository.findById(organizationId);
  if (!existingOrganization) {
    throw new AppError('Organization not found', 404);
  }

  // Verify member exists and belongs to organization
  const existingMember = await memberRepository.findById(memberId);
  if (!existingMember || existingMember.organizationId.toString() !== organizationId.toString()) {
    throw new AppError('Member not found or does not belong to the organization', 404);
  }

  if (!professionalProfile) {
    throw new AppError('Professional profile data is required', 400);
  }

  // Prepare update object
  const updateFields = {
    summary: {
      ...existingMember.summary,
      professionalProfile: {
        ...existingMember.summary?.professionalProfile,
        ...professionalProfile,
      },
    },
  };

  if (professionalProfile.functionalArea) {
    updateFields.summary.professionalProfile.functionalArea = professionalProfile.functionalArea;
  }

  if (professionalProfile.location) {
    updateFields.summary.professionalProfile.location = {
      ...existingMember.summary?.professionalProfile?.location,
      ...professionalProfile.location,
    };
  }

  return await memberRepository.updateSummary(memberId, updateFields);
};

// Update Lead Generation Goals Service
const updateLeadGenerationGoals = async (memberId, organizationId, leadGenData) => {
  const { leadGenerationGoals } = leadGenData;

  const existingOrganization = await organizationRepository.findById(organizationId);
  if (!existingOrganization) {
    throw new AppError('Organization not found', 404);
  }

  const existingMember = await memberRepository.findById(memberId);

  const updatedLeadGenerationGoals = {
    ...(existingMember.leadGenerationGoals?.toObject?.() || {}),
    ...leadGenerationGoals,
    targetAudience: {
      ...(existingMember.leadGenerationGoals?.targetAudience?.toObject?.() || {}),
      ...(leadGenerationGoals.targetAudience || {}),
    },
  };

  return await memberRepository.updateLeadGenerationGoals(memberId, {
    leadGenerationGoals: updatedLeadGenerationGoals,
  });
};

// Update Complete Summary Service - Enhanced to handle all form data
const updateCompleteSummary = async (memberId, organizationId, memberData) => {
  try {
    // Verify organization exists
    const existingOrganization = await organizationRepository.findById(organizationId);
    if (!existingOrganization) {
      throw new AppError('Organization not found', 404);
    }

    // Verify member exists and belongs to organization
    const existingMember = await memberRepository.findById(memberId);
    if (!existingMember || existingMember.organizationId.toString() !== organizationId.toString()) {
      throw new AppError('Member not found or does not belong to the organization', 404);
    }

    if (!memberData) {
      throw new AppError('Form data is required', 400);
    }

    const formData = memberData.formData;

    // Prepare comprehensive update object
    const updateFields = {};

    // Handle Step 1: Lead Saving Settings -> postSavingPreferences
    if (formData.postSavingPreferences) {
      const leadSavingData = formData.postSavingPreferences;

      updateFields.postSavingPreferences = {
        ...(existingMember.postSavingPreferences?.toObject?.() || existingMember.postSavingPreferences || {}),
        enabled: leadSavingData.enabled !== undefined ? leadSavingData.enabled : true,
        enableCustomKeywords: leadSavingData.enableCustomKeywords !== undefined ? leadSavingData.enableCustomKeywords : true,
        keywords: leadSavingData.keywords || [],
        excludeKeywords: leadSavingData.excludeKeywords || [],
        saveAllPosts: leadSavingData.saveAllPosts !== undefined ? leadSavingData.saveAllPosts : false,
        maxPostsPerDay: Math.min(Math.max(leadSavingData.maxPostsPerDay || 100, 1), 1000),
        minCharCount: leadSavingData.minCharCount || 50,
        postTypes: leadSavingData.postTypes || ['all'],
        autoTagPosts: leadSavingData.autoTagPosts !== undefined ? leadSavingData.autoTagPosts : false,
        customCategories: leadSavingData.customCategories || [],
        autoDetectEmailAddresses: leadSavingData.autoDetectEmailAddresses !== undefined ? leadSavingData.autoDetectEmailAddresses : true,
        autoDetectFormLinks: leadSavingData.autoDetectFormLinks !== undefined ? leadSavingData.autoDetectFormLinks : true,
        saveFrequency: leadSavingData.saveFrequency || 'realtime',
      };
    }
    // Handle Step 2: Professional Profile -> summary.professionalProfile
    if (formData['summary.professionalProfile']) {
      const profileData = formData['summary.professionalProfile'];

      // Initialize summary if it doesn't exist
      if (!updateFields.summary) {
        updateFields.summary = {
          ...(existingMember.summary?.toObject?.() || existingMember.summary || {}),
        };
      }

      updateFields.summary.professionalProfile = {
        ...(existingMember.summary?.professionalProfile?.toObject?.() || existingMember.summary?.professionalProfile || {}),
        currentRole: profileData.currentRole ? profileData.currentRole.substring(0, 100) : '',
        profileDescription: profileData.profileDescription ? profileData.profileDescription.substring(0, 500) : '',
        experienceLevel: profileData.experienceLevel || 'entry',
        industry: profileData.industry ? profileData.industry.substring(0, 100) : '',
        functionalArea: Array.isArray(profileData.functionalArea) ? profileData.functionalArea.slice(0, 10) : [],
        companySize: profileData.companySize || 'small',
        location: {
          ...(existingMember.summary?.professionalProfile?.location?.toObject?.() || existingMember.summary?.professionalProfile?.location || {}),
          city: profileData.location?.city ? profileData.location.city.substring(0, 100) : '',
          country: profileData.location?.country ? profileData.location.country.substring(0, 100) : 'India',
          workMode: profileData.location?.workMode || 'hybrid',
        },
      };
    }

    // Handle Step 3: Lead Generation Goals -> leadGenerationGoals (root level)
    if (formData.leadGenerationGoals) {
      const goalsData = formData.leadGenerationGoals;

      updateFields.leadGenerationGoals = {
        ...(existingMember.leadGenerationGoals?.toObject?.() || existingMember.leadGenerationGoals || {}),
        primaryObjective: goalsData.primaryObjective || 'networking',
        businessType: goalsData.businessType || 'b2b',
        serviceOfferings: Array.isArray(goalsData.serviceOfferings) ? goalsData.serviceOfferings.slice(0, 15) : [],
        targetAudience: {
          ...(existingMember.leadGenerationGoals?.targetAudience?.toObject?.() || existingMember.leadGenerationGoals?.targetAudience || {}),
          roles: Array.isArray(goalsData.targetAudience?.roles) ? goalsData.targetAudience.roles.slice(0, 20) : [],
          industries: Array.isArray(goalsData.targetAudience?.industries) ? goalsData.targetAudience.industries.slice(0, 20) : [],
          companySizes: Array.isArray(goalsData.targetAudience?.companySizes) ? goalsData.targetAudience.companySizes : [],
          seniority: Array.isArray(goalsData.targetAudience?.seniority) ? goalsData.targetAudience.seniority : [],
        },
      };
    }

    // Handle Step 5: Automation Settings -> leadGenerationGoals.automation
    if (formData.leadGenerationGoals?.automation) {
      const automationData = formData.leadGenerationGoals.automation;

      // Ensure leadGenerationGoals exists
      if (!updateFields.leadGenerationGoals) {
        updateFields.leadGenerationGoals = {
          ...(existingMember.leadGenerationGoals?.toObject?.() || existingMember.leadGenerationGoals || {}),
        };
      }

      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      const timeOfDay = timeRegex.test(automationData.timeOfDay) ? automationData.timeOfDay : '09:00';

      updateFields.leadGenerationGoals.automation = {
        ...(existingMember.leadGenerationGoals?.automation?.toObject?.() || existingMember.leadGenerationGoals?.automation || {}),
        isEnabled: automationData.isEnabled !== undefined ? automationData.isEnabled : false,
        automationType: automationData.automationType || 'none',
        executionMode: automationData.executionMode || 'manual',
        schedule: {
          ...(existingMember.leadGenerationGoals?.automation?.schedule?.toObject?.() || existingMember.leadGenerationGoals?.automation?.schedule || {}),
          frequency: automationData.frequency || 'weekly',
          timeOfDay: timeOfDay,
          daysOfWeek: Array.isArray(automationData.daysOfWeek) ? automationData.daysOfWeek : ['monday', 'wednesday', 'friday'],
          timezone: automationData.timezone || 'UTC',
          customCronExpression: automationData.customCronExpression || null,
        },
      };
    }

    // Handle Step 4: Custom Requirements (if you want to store this)
    if (formData.customRequirements) {
      updateFields.customRequirements = formData.customRequirements.customRequirements;
    }

    // Validate the update fields against schema constraints
    const validationResult = validateUpdateFields(updateFields);
    if (!validationResult.isValid) {
      throw new AppError(`Validation failed: ${validationResult.errors.join(', ')}`, 400);
    }

    // Perform the update
    const updatedMember = await memberRepository.updateById(memberId, updateFields);

    return {
      success: true,
      member: updatedMember,
      updatedFields: Object.keys(updateFields),
      message: 'Member summary and settings updated successfully',
    };
  } catch (error) {
    throw error;
  }
};

// Get Member Summary Service
const getMemberSummary = async (memberId, organizationId) => {
  // Verify organization exists
  const existingOrganization = await organizationRepository.findById(organizationId);
  if (!existingOrganization) {
    throw new AppError('Organization not found', 404);
  }

  const member = await memberRepository.findMemberSummary(memberId, organizationId);

  if (!member) {
    throw new AppError('Member not found or does not belong to the organization', 404);
  }

  return {
    id: member._id,
    name: member.name,
    email: member.email,
    summary: member.summary || {
      professionalProfile: {},
      leadGenerationGoals: {},
    },
  };
};

// Update Feed Filter Settings Service
const updateFeedFilterSettings = async (memberId, organizationId, feedFilterData) => {
  const { feedFilterSettings } = feedFilterData;

  const existingOrganization = await organizationRepository.findById(organizationId);
  if (!existingOrganization) {
    throw new AppError('Organization not found', 404);
  }

  const existingMember = await memberRepository.findById(memberId);
  if (!existingMember || existingMember.organizationId.toString() !== organizationId.toString()) {
    throw new AppError('Member not found or does not belong to the organization', 404);
  }

  if (!feedFilterSettings) {
    throw new AppError('Feed filter settings are required', 400);
  }

  return await memberRepository.updateFeedFilterSettings(memberId, { feedFilterSettings });
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
  getMemberByIdAndOrg,
  getMemberById,
  connectMember,
  updateMemberProfile,
  updateCreditsUsedToday,
  consumeCredits,
  deleteMember,
  updateMemberSettings,
  updateMemberSummary,
  updateLeadGenerationGoals,
  updateCompleteSummary,
  getMemberSummary,
  getMemberWithOrganizationDetails,
  updateFeedFilterSettings,
};
