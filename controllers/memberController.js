const dotenv = require('dotenv');
dotenv.config();
const catchAsync = require('./../utils/catchAsync');
const memberService = require('../services/Member/memberService');
const rateLimitMiddleware = require('../middlewares/rateLimiter');
const { createSendToken } = require('./../middlewares/tokenUtils');
const AppError = require('../utils/appError');

// WEB REQUEST - ADD NEW MEMBER TO THE ORG
exports.createMember = catchAsync(async (req, res, next) => {
  const { name, email, timeZone } = req.body;
  const organizationId = req.organization._id;

  const result = await memberService.createMember(organizationId, { name, email, timeZone });

  res.status(201).json({
    message: 'Member created successfully',
    data: result,
  });
});

// EXTN REQUEST TO GET THE PROFILE OF THE MEMBER
exports.getProfile = catchAsync(async (req, res, next) => {
  const memberId = req.member._id;
  const profile = await memberService.getMemberWithOrganizationDetails(memberId);
  console.log(profile);
  res.status(200).json({
    status: 'success',
    profile,
  });
});

// EXTN REQUEST TO CHECK IF THE MEMBER EXISTS
exports.checkMemberExists = catchAsync(async (req, res, next) => {
  const { name, profileLink } = req.body;

  const member = await memberService.checkMemberExists(name, profileLink, req);

  res.status(200).json({
    success: true,
    isMemberFound: member,
  });
});

// EXTN REQUEST TO CONNECT THE EXTN USING EXTN TOKEN
exports.addConnectionToken = catchAsync(async (req, res, next) => {
  const { connectionToken, name, profileLink, profilePicture, email } = req.body;
  console.log(connectionToken, name, profileLink, profilePicture, email);

  const member = await memberService.connectMember({
    connectionToken,
    name,
    profileLink,
    profilePicture,
    email,
  });

  const isMember = true;
  const isOrganization = false;
  createSendToken(member, 200, res, isOrganization, isMember);
});

// WEB REQUEST TO GET ALL THE MEMBER DETAILS
exports.getAllMembersOfOrganization = catchAsync(async (req, res, next) => {
  const organizationId = req.organization._id;
  const members = await memberService.findAllByOrganizationId(organizationId);

  if (!members || members.length === 0) {
    return res.status(200).json({
      status: 'success',
      members: [],
      message: 'No members found for this organization',
    });
  }

  res.status(200).json({
    status: 'success',
    members,
  });
});

// EXTN REQUEST TO UPDATE DAYS ACTIVE
exports.updateDaysActive = catchAsync(async (req, res, next) => {
  const { activeDays } = req.body;
  const memberId = req.member._id;
  console.log(activeDays);

  if (activeDays < 0) {
    return next(new AppError('Please provide valid active days', 400));
  }
  const updatedMember = await memberService.updateDaysActive(memberId, activeDays);

  res.status(200).json({
    success: true,
    member: updatedMember,
  });
});

// EXTN REQUEST TO UPDATE PROFILE VISIBILITY
exports.updateLeaderboardProfileVisibility = [
  rateLimitMiddleware,
  catchAsync(async (req, res, next) => {
    const { leaderBoardProfileVisibility } = req.body;
    const memberId = req.member._id;

    if (typeof leaderBoardProfileVisibility !== 'boolean') {
      return next(new AppError('Please provide valid visibility setting', 400));
    }

    const updatedMember = await memberService.updateLeaderboardVisibility(memberId, leaderBoardProfileVisibility);

    res.status(200).json({
      success: true,
      member: updatedMember,
    });
  }),
];

// EXTEN REQUEST TO FETCH THE LEADERBOARD
exports.getLeaderboard = catchAsync(async (req, res, next) => {
  const memberId = req.member._id;

  const leaderboardData = await memberService.getLeaderboard(memberId);

  res.status(200).json({
    status: 'success',
    user: leaderboardData.member,
    rank: leaderboardData.rank,
    users: leaderboardData.leaderboard,
  });
});

// EXTN REQUEST TO UPDATE THE MEMBER PROFILE STATS
exports.updateMemberProfileStats = catchAsync(async (req, res, next) => {
  const userId = req.member.id;
  const organizationId = req.member.organizationId;
  const memberDetails = req.body;

  const updatedMember = await memberService.updateMemberProfileStats(userId, organizationId, memberDetails);

  res.status(200).json({
    status: 'success',
    data: updatedMember,
  });
});

// WEB REQUEST TO GET MEMBER DETAILS BY MEMBER ID AND ORG ID
exports.getMemberDetailsByIds = catchAsync(async (req, res, next) => {
  const { organizationId, memberId } = req.params;

  const member = await memberService.getMemberByIdAndOrg(memberId, organizationId);

  res.status(200).json({
    status: 'success',
    data: member,
  });
});

// WEB REQUEST TO GET MEMBER DETAILS BY MEMBER ID
exports.getMemberDetailsById = catchAsync(async (req, res, next) => {
  const { memberId } = req.params;
  const organizationId = req.organization._id;

  const member = await memberService.getMemberByIdAndOrg(memberId, organizationId);

  res.status(200).json({
    status: 'success',
    data: member,
  });
});

// WEB REQUEST TO SUBMIT SURVEY FEEDBACK
exports.submitSurvey = catchAsync(async (req, res, next) => {
  const { formData } = req.body;

  await memberService.submitSurvey(formData);

  res.status(200).json({
    status: 'success',
    message: 'Feedback submitted successfully. Thank you!',
  });
});

// WEB REQUEST TO DELETE MEMBER ACCOUNT
exports.deleteMemberAccount = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId;
  const organizationId = req.organization.id;

  await memberService.deleteMember(memberId);

  res.status(200).json({
    status: 'success',
    message: 'Member account deleted successfully',
    data: null,
  });
});

// WEB REQUEST TO UPDATE MEMBER SETTINGS
exports.updateMemberSettings = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId || req.member.id;
  const organizationId = req.organization.id;

  const updatedMember = await memberService.updateMemberSettings(memberId, organizationId, req.body);

  res.status(200).json({
    status: 'success',
    data: updatedMember,
  });
});

// WEB REQUEST TO UPDATE MEMBER SUMMARY
exports.updateMemberSummary = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId || req.member.id;
  const organizationId = req.organization.id;

  const updatedMember = await memberService.updateMemberSummary(memberId, organizationId, req.body);

  res.status(200).json({
    status: 'success',
    data: {
      summary: updatedMember.summary,
    },
  });
});

// WEB REQUEST TO UPDATE LEAD GENERATION GOALS
exports.updateLeadGenerationGoals = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId || req.member.id;
  const organizationId = req.organization.id;

  const updatedMember = await memberService.updateLeadGenerationGoals(memberId, organizationId, req.body);

  res.status(200).json({
    status: 'success',
    data: {
      leadGenerationGoals: updatedMember.leadGenerationGoals,
    },
  });
});

// WEB REQUEST TO UPDATE COMPLETE SUMMARY
exports.updateCompleteSummary = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId || req.member.id;
  const organizationId = req.organization.id;

  const updatedMember = await memberService.updateCompleteSummary(memberId, organizationId, req.body);

  res.status(200).json({
    status: 'success',
    data: {
      summary: updatedMember.summary,
    },
  });
});

exports.updateCreditsUsedToday = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId || req.member.id;
  const organizationId = req.organization.id;

  const updatedMember = await memberService.updateCreditsUsedToday(memberId, organizationId);

  res.status(200).json({
    status: 'success',
    data: updatedMember,
  });
});

// WEB REQUEST TO GET MEMBER SUMMARY
exports.getMemberSummary = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId || req.member.id;
  const organizationId = req.organization.id;

  const member = await memberService.getMemberSummary(memberId, organizationId);

  res.status(200).json({
    status: 'success',
    data: {
      member,
    },
  });
});

// WEB REQUEST TO UPDATE FEED FILTER SETTINGS
exports.updateFeedFilterSettings = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId;
  const organizationId = req.organization.id;

  const updatedMember = await memberService.updateFeedFilterSettings(memberId, organizationId, req.body);

  res.status(200).json({
    status: 'success',
    data: {
      feedFilterSettings: updatedMember.feedFilterSettings,
    },
  });
});
