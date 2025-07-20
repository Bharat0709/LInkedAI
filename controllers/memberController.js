const dotenv = require('dotenv');
dotenv.config();
const catchAsync = require('./../utils/catchAsync');
const Organization = require('../models/organization');
const Member = require('../models/members');
const memberService = require('../services/Member/memberService');
const ContentCalendar = require('../models/contentCalender');
const { sendSurveyForm } = require('../services/email/admin');
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
  const profile = await memberService.getMemberById(memberId);

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

exports.updateMemberSettings = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId || req.member.id;
  const organizationId = req.organization.id;
  const { timeZone, postSavingPreferences } = req.body;

  try {
    // Verify organization exists
    const existingOrganization = await Organization.findById(organizationId);
    if (!existingOrganization) {
      return next(new AppError('Organization not found', 404));
    }

    // Verify member exists and belongs to organization
    const existingMember = await Member.findById(memberId);
    if (!existingMember || existingMember.organizationId.toString() !== organizationId.toString()) {
      return next(new AppError('Member not found or does not belong to the organization', 404));
    }

    // Prepare update object with only the fields that need to be updated
    const updateFields = {};

    // Add fields to update object only if they exist in the request
    if (timeZone) updateFields.timeZone = timeZone;

    // Handle post saving preferences update
    if (postSavingPreferences) {
      // Get the current member data to merge preferences properly
      updateFields.postSavingPreferences = {
        ...existingMember.postSavingPreferences, // Keep existing preferences as base
        ...postSavingPreferences, // Override with new preferences
      };

      // Special handling for nested arrays if they exist in the request
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

    // Only proceed if there are fields to update
    if (Object.keys(updateFields).length === 0) {
      return next(new AppError('No valid fields to update', 400));
    }

    const updatedMember = await Member.findByIdAndUpdate(memberId, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedMember) {
      return next(new AppError('Member not found', 404));
    }

    // Send success response
    res.status(200).json({
      status: 'success',
      data: updatedMember,
    });
  } catch (error) {
    next(new AppError('Error updating member settings', 500));
  }
});

exports.getMemberDetailsByIds = catchAsync(async (req, res, next) => {
  const { organizationId, memberId } = req.params;
  try {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return next(new AppError('Organization not found', 404));
    }

    const member = await Member.findOne({
      _id: memberId,
      organizationId,
    });

    if (!member) {
      return next(new AppError('Member not found or does not belong to the organization', 404));
    }

    res.status(200).json({
      status: 'success',
      data: member,
    });
  } catch (error) {
    next(new AppError('Error retrieving member details', 500));
  }
});

exports.updateFeedFilterSettings = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId;
  const organizationId = req.organization.id;
  const { feedFilterSettings } = req.body;

  try {
    const existingOrganization = await Organization.findById(organizationId);
    if (!existingOrganization) {
      return next(new AppError('Organization not found', 404));
    }

    // Verify member exists and belongs to organization
    const existingMember = await Member.findById(memberId);
    if (!existingMember || existingMember.organizationId.toString() !== organizationId.toString()) {
      return next(new AppError('Member not found or does not belong to the organization', 404));
    }

    // Validate that feedFilterSettings is provided
    if (!feedFilterSettings) {
      return next(new AppError('Feed filter settings are required', 400));
    }

    // Update the member's feed filter settings
    const updatedMember = await Member.findByIdAndUpdate(
      memberId,
      { feedFilterSettings },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedMember) {
      return next(new AppError('Member not found', 404));
    }

    // Send success response
    res.status(200).json({
      status: 'success',
      data: {
        feedFilterSettings: updatedMember.feedFilterSettings,
      },
    });
  } catch (error) {
    next(new AppError('Error updating feed filter settings', 500));
  }
});

exports.getMemberDetailsById = catchAsync(async (req, res, next) => {
  const { memberId } = req.params;
  const organizationId = req.organization.id;
  try {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return next(new AppError('Organization not found', 404));
    }

    const member = await Member.findOne({
      _id: memberId,
      organizationId,
    });

    if (!member) {
      return next(new AppError('Member not found or does not belong to the organization', 404));
    }

    res.status(200).json({
      status: 'success',
      data: member,
    });
  } catch (error) {
    next(new AppError('Error retrieving member details', 500));
  }
});

exports.disconnectLinkedIn = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId;
  const organizationId = req.organization.id;
  try {
    const member = await Member.findOne({ _id: memberId, organizationId });
    if (!member) {
      return next(new AppError('Member not found or does not belong to the organization', 404));
    }

    if (member.isLinkedinConnected === false) {
      return next(new AppError('Member is not connected to LinkedIn', 400));
    }

    member.isLinkedinConnected = false;
    member.linkedinAccessToken = null;
    member.tokenExpiresIn = null;
    member.linkedinProfileId = null;

    await member.save();

    // Send success response
    res.status(200).json({
      status: 'success',
      message: 'Member successfully disconnected from LinkedIn',
    });
  } catch (error) {
    next(new AppError('Error disconnecting LinkedIn', 500));
  }
});

exports.submitSurvey = catchAsync(async (req, res, next) => {
  const { formData } = req.body;

  const { usability, performance, missingFeatures, reason, email, overallSatisfaction } = formData;

  // Validate the required fields
  if (!usability || !performance || !overallSatisfaction || !reason) {
    return next(new AppError('Usability, performance, overall satisfaction, and reason are required fields.', 400));
  }

  try {
    sendSurveyForm(usability, performance, missingFeatures, reason, email, overallSatisfaction);
    res.status(200).json({
      status: 'success',
      message: 'Feedback submitted successfully. Thank you!',
    });
  } catch (error) {
    next(new AppError('Error submitting the survey feedback.', 500));
  }
});

exports.addContentCalendar = catchAsync(async (req, res, next) => {
  const memberId = req.params.id;
  const organizationId = req.organization.id;
  const { calendarData } = req.body;
  if (!Array.isArray(calendarData) || calendarData.length === 0) {
    return next(new AppError('Calendar data must be an array and cannot be empty.', 400));
  }

  const member = await Member.findOne({ _id: memberId, organizationId });
  if (!member) {
    return next(new AppError('Member not found or does not belong to the organization.', 404));
  }

  const calendarEntries = [];

  for (let data of calendarData) {
    const { title, date, time } = data;

    if (!title || !date || !time) {
      return next(new AppError('Title, Date, and Time are required fields for each calendar entry.', 400));
    }

    // Create a new content calendar entry
    const calendarEntry = new ContentCalendar({
      topic: title,
      date: date,
      time: time,
      memberId,
      organizationId,
      status: 'Planned',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    calendarEntries.push(calendarEntry);
  }
  await ContentCalendar.insertMany(calendarEntries);

  res.status(201).json({
    status: 'success',
    message: 'Content calendar entries have been successfully added.',
    data: {
      contentCalendar: calendarEntries,
    },
  });
});

exports.getContentCalendar = catchAsync(async (req, res, next) => {
  const memberId = req.params.id;
  const organizationId = req.organization.id;

  let contentCalendar = await ContentCalendar.find({
    memberId,
    organizationId,
  }).sort({ date: 1 });

  if (!contentCalendar || contentCalendar.length === 0) {
    contentCalendar == [];
  }

  res.status(200).json({
    status: 'success',
    message: 'Content calendar entries fetched successfully.',
    data: {
      contentCalendar,
    },
  });
});

exports.updateContentCalendar = catchAsync(async (req, res, next) => {
  const memberId = req.params.id;
  const organizationId = req.organization.id;
  const contentId = req.params.contentId;
  const updatedData = req.body;
  const { topic, date, time, status } = updatedData;

  if (!topic || !date || !time || !status) {
    return next(new AppError('Missing required fields: topic, date, time, and status are required.', 400));
  }

  // Verify Member and Organization
  const member = await Member.findOne({ _id: memberId, organizationId });
  if (!member) {
    return next(new AppError('Member not found or does not belong to the organization.', 404));
  }

  const calendarEntry = await ContentCalendar.findOne({
    _id: contentId,
    memberId,
    organizationId,
  });

  if (!calendarEntry) {
    return next(new AppError('Content Calendar entry not found.', 404));
  }

  calendarEntry.topic = topic;
  calendarEntry.date = date;
  calendarEntry.time = time;
  calendarEntry.status = status;
  calendarEntry.updatedAt = Date.now();

  await calendarEntry.save();

  res.status(200).json({
    status: 'success',
    message: 'Content Calendar entry updated successfully.',
    data: {
      contentCalendar: calendarEntry,
    },
  });
});

exports.deleteContentCalendar = catchAsync(async (req, res, next) => {
  const memberId = req.params.id;
  const organizationId = req.organization.id;
  const contentId = req.params.contentId;

  // Verify Member and Organization
  const member = await Member.findOne({ _id: memberId, organizationId });
  if (!member) {
    return next(new AppError('Member not found or does not belong to the organization.', 404));
  }

  const deletedEntry = await ContentCalendar.findOneAndDelete({
    _id: contentId,
    memberId,
    organizationId,
  });

  if (!deletedEntry) {
    return next(new AppError('Content Calendar entry not found.', 404));
  }

  res.status(204).json({
    status: 'success',
    message: 'Content Calendar entry deleted successfully.',
  });
});

exports.deleteMemberAccount = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId;
  const organizationId = req.organization.id;

  try {
    // Verify organization exists
    const existingOrganization = await Organization.findById(organizationId);
    if (!existingOrganization) {
      return next(new AppError('Organization not found', 404));
    }

    // Verify member exists and belongs to organization
    const existingMember = await Member.findById(memberId);
    if (!existingMember) {
      return next(new AppError('Member not found', 404));
    }

    if (existingMember.organizationId.toString() !== organizationId.toString()) {
      return next(new AppError('Member does not belong to the organization', 403));
    }

    // Delete the member
    const deletedMember = await Member.findByIdAndDelete(memberId);

    if (!deletedMember) {
      return next(new AppError('Member not found', 404));
    }

    // Send success response
    res.status(200).json({
      status: 'success',
      message: 'Member account deleted successfully',
      data: null,
    });
  } catch (error) {
    next(new AppError('Error deleting member account', 500));
  }
});

// Update Member Summary (Professional Profile)
exports.updateMemberSummary = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId || req.member.id;
  const organizationId = req.organization.id;
  const { professionalProfile } = req.body;

  try {
    // Verify organization exists
    const existingOrganization = await Organization.findById(organizationId);
    if (!existingOrganization) {
      return next(new AppError('Organization not found', 404));
    }

    // Verify member exists and belongs to organization
    const existingMember = await Member.findById(memberId);
    if (!existingMember || existingMember.organizationId.toString() !== organizationId.toString()) {
      return next(new AppError('Member not found or does not belong to the organization', 404));
    }

    // Validate that professionalProfile is provided
    if (!professionalProfile) {
      return next(new AppError('Professional profile data is required', 400));
    }

    // Prepare update object - merge with existing summary data
    const updateFields = {
      summary: {
        ...existingMember.summary, // Keep existing summary data
        professionalProfile: {
          ...existingMember.summary?.professionalProfile, // Keep existing professional profile as base
          ...professionalProfile, // Override with new data
        },
      },
    };

    // Special handling for nested objects and arrays
    if (professionalProfile.functionalArea) {
      updateFields.summary.professionalProfile.functionalArea = professionalProfile.functionalArea;
    }

    if (professionalProfile.location) {
      updateFields.summary.professionalProfile.location = {
        ...existingMember.summary?.professionalProfile?.location,
        ...professionalProfile.location,
      };
    }

    // Update the member's summary
    const updatedMember = await Member.findByIdAndUpdate(memberId, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedMember) {
      return next(new AppError('Member not found', 404));
    }

    // Send success response
    res.status(200).json({
      status: 'success',
      data: {
        summary: updatedMember.summary,
      },
    });
  } catch (error) {
    next(new AppError('Error updating member summary', 500));
  }
});

// Update Lead Generation Goals
exports.updateLeadGenerationGoals = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId || req.member.id;
  const organizationId = req.organization.id;
  const { leadGenerationGoals } = req.body;

  try {
    const existingOrganization = await Organization.findById(organizationId);
    if (!existingOrganization) {
      return next(new AppError('Organization not found', 404));
    }

    // Get existing member to merge with current leadGenerationGoals
    const existingMember = await Member.findById(memberId);

    // Merge existing leadGenerationGoals with new data
    const updatedLeadGenerationGoals = {
      ...(existingMember.leadGenerationGoals?.toObject?.() || {}),
      ...leadGenerationGoals,
      targetAudience: {
        ...(existingMember.leadGenerationGoals?.targetAudience?.toObject?.() || {}),
        ...(leadGenerationGoals.targetAudience || {}),
      },
    };

    // Update with complete object
    const updatedMember = await Member.findByIdAndUpdate(
      memberId,
      {
        leadGenerationGoals: updatedLeadGenerationGoals,
      },
      {
        new: true,
        runValidators: true,
        select: 'leadGenerationGoals',
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        leadGenerationGoals: updatedMember.leadGenerationGoals,
      },
    });
  } catch (error) {
    console.error('Error updating lead generation goals:', error);
    next(new AppError(`Error updating lead generation goals: ${error.message}`, 500));
  }
});

// Update Complete Summary (Both Professional Profile and Lead Generation Goals)
exports.updateCompleteSummary = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId || req.member.id;
  const organizationId = req.organization.id;
  const { summary } = req.body;

  try {
    // Verify organization exists
    const existingOrganization = await Organization.findById(organizationId);
    if (!existingOrganization) {
      return next(new AppError('Organization not found', 404));
    }

    // Verify member exists and belongs to organization
    const existingMember = await Member.findById(memberId);
    if (!existingMember || existingMember.organizationId.toString() !== organizationId.toString()) {
      return next(new AppError('Member not found or does not belong to the organization', 404));
    }

    // Validate that summary is provided
    if (!summary) {
      return next(new AppError('Summary data is required', 400));
    }

    // Prepare update object - merge with existing summary data
    const updateFields = {
      summary: {
        ...existingMember.summary, // Keep existing summary data as base
        ...summary, // Override with new summary data
      },
    };

    // Special handling for professionalProfile if provided
    if (summary.professionalProfile) {
      updateFields.summary.professionalProfile = {
        ...summary.professionalProfile,
      };

      // Handle nested objects
      if (summary.professionalProfile.location) {
        updateFields.summary.professionalProfile.location = {
          ...summary.professionalProfile.location,
        };
      }

      // Handle arrays
      if (summary.professionalProfile.functionalArea) {
        updateFields.summary.professionalProfile.functionalArea = summary.professionalProfile.functionalArea;
      }
    }

    // Special handling for leadGenerationGoals if provided
    if (summary.leadGenerationGoals) {
      updateFields.summary.leadGenerationGoals = {
        ...summary.leadGenerationGoals,
      };

      // Handle nested targetAudience object
      if (summary.leadGenerationGoals.targetAudience) {
        updateFields.summary.leadGenerationGoals.targetAudience = {
          ...summary.leadGenerationGoals.targetAudience,
        };
      }

      // Handle arrays
      if (summary.leadGenerationGoals.serviceOfferings) {
        updateFields.summary.leadGenerationGoals.serviceOfferings = summary.leadGenerationGoals.serviceOfferings;
      }
    }

    // Update the member's complete summary
    const updatedMember = await Member.findByIdAndUpdate(memberId, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedMember) {
      return next(new AppError('Member not found', 404));
    }

    // Send success response
    res.status(200).json({
      status: 'success',
      data: {
        summary: updatedMember.summary,
      },
    });
  } catch (error) {
    next(new AppError('Error updating complete summary', 500));
  }
});

// Get Member Summary
exports.getMemberSummary = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId || req.member.id;
  const organizationId = req.organization.id;

  try {
    // Verify organization exists
    const existingOrganization = await Organization.findById(organizationId);
    if (!existingOrganization) {
      return next(new AppError('Organization not found', 404));
    }

    // Get member with summary data
    const member = await Member.findOne({
      _id: memberId,
      organizationId,
    }).select('summary name email currentRole');

    if (!member) {
      return next(new AppError('Member not found or does not belong to the organization', 404));
    }

    // Send success response
    res.status(200).json({
      status: 'success',
      data: {
        member: {
          id: member._id,
          name: member.name,
          email: member.email,
          summary: member.summary || {
            professionalProfile: {},
            leadGenerationGoals: {},
          },
        },
      },
    });
  } catch (error) {
    next(new AppError('Error retrieving member summary', 500));
  }
});
