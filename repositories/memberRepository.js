const Member = require('../models/members');

const findById = async id => {
  return await Member.findById(id);
};

const findByOrganizationId = async organizationId => {
  return await Member.find({ organizationId });
};

const findAllByOrganizationId = async organizationId => {
  return await Member.find({ organizationId }).sort({ createdAt: -1 });
};

const findByIdAndOrg = async (memberId, organizationId) => {
  return await Member.findOne({ _id: memberId, organizationId });
};

const findByEmail = async email => {
  return await Member.findOne({ email });
};

const findByNameAndProfileLink = async (name, profileLink) => {
  return await Member.findOne({ name, profileLink });
};

const findByConnectionToken = async connectionToken => {
  return await Member.findOne({ connectionToken });
};

const findLeaderboard = async (limit = 20) => {
  return await Member.find(
    {},
    {
      name: 1,
      profileLink: 1,
      daysActive: 1,
      leaderBoardProfileVisibility: 1,
    }
  )
    .sort({ daysActive: -1 })
    .limit(limit);
};

const findAllSortedByDaysActive = async () => {
  return await Member.find({}, { _id: 0, daysActive: 1 }).sort({
    daysActive: -1,
  });
};

const create = async memberData => {
  const member = new Member(memberData);
  return await member.save();
};

const updateById = async (id, updateData) => {
  return await Member.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

const updateProfile = async (id, profileData) => {
  const member = await Member.findById(id);
  if (!member) {
    return null;
  }

  Object.keys(profileData).forEach(key => {
    if (profileData[key] !== undefined) {
      member[key] = profileData[key];
    }
  });

  return await member.save();
};

const updateSettings = async (id, settingsData) => {
  return await Member.findByIdAndUpdate(id, settingsData, {
    new: true,
    runValidators: true,
  });
};

const updateSummary = async (id, summaryData) => {
  return await Member.findByIdAndUpdate(id, summaryData, {
    new: true,
    runValidators: true,
  });
};

const updateLeadGenerationGoals = async (id, leadGenData) => {
  return await Member.findByIdAndUpdate(id, leadGenData, {
    new: true,
    runValidators: true,
    select: 'leadGenerationGoals',
  });
};

const updateFeedFilterSettings = async (id, feedFilterData) => {
  return await Member.findByIdAndUpdate(id, feedFilterData, {
    new: true,
    runValidators: true,
  });
};

const findMemberSummary = async (memberId, organizationId) => {
  return await Member.findOne({
    _id: memberId,
    organizationId,
  }).select('summary name email currentRole');
};

const updateDaysActiveAndStreak = async (id, activeDays, currentStreak) => {
  return await Member.findByIdAndUpdate(
    id,
    {
      daysActive: activeDays,
      currentStreak,
      lastActive: new Date(),
    },
    { new: true }
  );
};

const softDelete = async id => {
  return await Member.findByIdAndUpdate(id, { active: false }, { new: true });
};

const deleteMember = async id => {
  return await Member.findByIdAndDelete(id);
};

const countByOrganizationId = async organizationId => {
  return await Member.countDocuments({ organizationId, active: true });
};

const updateMemberProfileStats = async (id, memberData, timeZone) => {
  const updateData = {
    lastSyncedAt: new Date().toLocaleString('en-GB', {
      timeZone: timeZone || 'Asia/Calcutta',
    }),
    ...memberData,
  };

  return await Member.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

const getGmailTokensByUserId = async (id) => {
  return await Member.findById(id)
    .select('+gmailTokens.accessToken +gmailTokens.refreshToken gmailTokens.email gmailTokens.expiryDate');
};

module.exports = {
  findById,
  findByEmail,
  findByIdAndOrg,
  findByNameAndProfileLink,
  findByConnectionToken,
  findByOrganizationId,
  findLeaderboard,
  findAllSortedByDaysActive,
  create,
  getGmailTokensByUserId,
  updateById,
  updateMemberProfileStats,
  updateProfile,
  updateSettings,
  updateSummary,
  updateLeadGenerationGoals,
  updateFeedFilterSettings,
  findMemberSummary,
  updateDaysActiveAndStreak,
  softDelete,
  deleteMember,
  countByOrganizationId,
  findAllByOrganizationId,
};
