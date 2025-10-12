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

const validateUpdateFields = updateFields => {
  const errors = [];

  try {
    // Validate postSavingPreferences
    if (updateFields.postSavingPreferences) {
      const prefs = updateFields.postSavingPreferences;

      if (prefs.keywords && prefs.keywords.length > 50) {
        errors.push('Keywords cannot exceed 50 items');
      }

      if (prefs.excludeKeywords && prefs.excludeKeywords.length > 50) {
        errors.push('Exclude keywords cannot exceed 50 items');
      }

      if (prefs.maxPostsPerDay && (prefs.maxPostsPerDay < 1 || prefs.maxPostsPerDay > 1000)) {
        errors.push('Max posts per day must be between 1 and 1000');
      }

      const validPostTypes = ['text', 'image', 'video', 'document', 'link', 'poll', 'all'];
      if (prefs.postTypes && !prefs.postTypes.every(type => validPostTypes.includes(type))) {
        errors.push('Invalid post type detected');
      }

      const validFrequencies = ['realtime', 'hourly', 'daily'];
      if (prefs.saveFrequency && !validFrequencies.includes(prefs.saveFrequency)) {
        errors.push('Invalid save frequency');
      }
    }

    // Validate professional profile
    if (updateFields.summary?.professionalProfile) {
      const profile = updateFields.summary.professionalProfile;

      if (profile.currentRole && profile.currentRole.length > 100) {
        errors.push('Current role cannot exceed 100 characters');
      }

      if (profile.profileDescription && profile.profileDescription.length > 500) {
        errors.push('Profile description cannot exceed 500 characters');
      }

      if (profile.industry && profile.industry.length > 100) {
        errors.push('Industry cannot exceed 100 characters');
      }

      if (profile.functionalArea && profile.functionalArea.length > 10) {
        errors.push('Functional areas cannot exceed 10 items');
      }

      const validExperienceLevels = ['entry', 'junior', 'mid', 'senior', 'executive', 'student', 'fresher'];
      if (profile.experienceLevel && !validExperienceLevels.includes(profile.experienceLevel)) {
        errors.push('Invalid experience level');
      }

      const validCompanySizes = ['startup', 'small', 'medium', 'large', 'enterprise', 'freelancer'];
      if (profile.companySize && !validCompanySizes.includes(profile.companySize)) {
        errors.push('Invalid company size');
      }

      if (profile.location) {
        if (profile.location.city && profile.location.city.length > 100) {
          errors.push('City cannot exceed 100 characters');
        }

        if (profile.location.country && profile.location.country.length > 100) {
          errors.push('Country cannot exceed 100 characters');
        }

        const validWorkModes = ['remote', 'onsite', 'hybrid', 'flexible'];
        if (profile.location.workMode && !validWorkModes.includes(profile.location.workMode)) {
          errors.push('Invalid work mode');
        }
      }
    }

    // Validate lead generation goals
    if (updateFields.leadGenerationGoals) {
      const goals = updateFields.leadGenerationGoals;

      const validObjectives = ['job_search', 'client_acquisition', 'partnership_building', 'networking', 'brand_building', 'knowledge_sharing', 'recruitment', 'sales_prospecting', 'investment_seeking', 'mentorship'];
      if (goals.primaryObjective && !validObjectives.includes(goals.primaryObjective)) {
        errors.push('Invalid primary objective');
      }

      const validBusinessTypes = ['b2b', 'b2c', 'b2b2c', 'freelancer', 'job_seeker', 'entrepreneur'];
      if (goals.businessType && !validBusinessTypes.includes(goals.businessType)) {
        errors.push('Invalid business type');
      }

      if (goals.serviceOfferings && goals.serviceOfferings.length > 15) {
        errors.push('Service offerings cannot exceed 15 items');
      }

      if (goals.targetAudience) {
        if (goals.targetAudience.roles && goals.targetAudience.roles.length > 20) {
          errors.push('Target roles cannot exceed 20 items');
        }

        if (goals.targetAudience.industries && goals.targetAudience.industries.length > 20) {
          errors.push('Target industries cannot exceed 20 items');
        }

        const validCompanySizes = ['startup', 'small', 'medium', 'large', 'enterprise'];
        if (goals.targetAudience.companySizes && !goals.targetAudience.companySizes.every(size => validCompanySizes.includes(size))) {
          errors.push('Invalid company size in target audience');
        }

        const validSeniority = ['entry', 'junior', 'mid', 'senior', 'executive', 'founder'];
        if (goals.targetAudience.seniority && !goals.targetAudience.seniority.every(level => validSeniority.includes(level))) {
          errors.push('Invalid seniority level in target audience');
        }
      }

      // Validate automation settings
      if (goals.automation) {
        const automation = goals.automation;

        const validAutomationTypes = ['semi', 'full', 'none'];
        if (automation.automationType && !validAutomationTypes.includes(automation.automationType)) {
          errors.push('Invalid automation type');
        }

        const validExecutionModes = ['realtime', 'scheduled', 'manual', 'hybrid'];
        if (automation.executionMode && !validExecutionModes.includes(automation.executionMode)) {
          errors.push('Invalid execution mode');
        }

        if (automation.schedule) {
          const schedule = automation.schedule;

          const validFrequencies = ['daily', 'weekly', 'bi-weekly', 'monthly', 'custom'];
          if (schedule.frequency && !validFrequencies.includes(schedule.frequency)) {
            errors.push('Invalid automation frequency');
          }

          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (schedule.timeOfDay && !timeRegex.test(schedule.timeOfDay)) {
            errors.push('Invalid time format. Use HH:MM (24-hour format)');
          }

          const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          if (schedule.daysOfWeek && !schedule.daysOfWeek.every(day => validDays.includes(day))) {
            errors.push('Invalid day of week');
          }
        }
      }
    }
  } catch (validationError) {
    errors.push(`Validation error: ${validationError.message}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
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
  validateUpdateFields,
};
