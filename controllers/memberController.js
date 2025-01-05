const AppError = require('./../utils/appError');
const dotenv = require('dotenv');
dotenv.config();
const catchAsync = require('./../utils/catchAsync');
const Organization = require('../models/organization');
const Member = require('../models/members');
const rateLimitMiddleware = require('../middlewares/rateLimiter');
const { generateConnectionToken } = require('../utils/randomString');
const { sendNewMemberInviteEmail } = require('./mailController');
const { createSendToken } = require('./../middlewares/tokenUtils');
const apiController = require('./apiController');

exports.verifyMemberDetails = catchAsync(async (req, res, next) => {
  const user = req.member;
  res.status(200).json({
    status: 'success',
    user,
  });
});

exports.checkMemberExists = catchAsync(async (req, res, next) => {
  const { name, profileLink } = req.body;
  const existingUser = await Member.findOne({ name, profileLink });
  if (existingUser && existingUser.email) {
    createSendToken(existingUser, 200, res, false, true);
  } else {
    return next(new AppError('Member not found', 400));
  }
});

exports.updateDaysActive = catchAsync(async (req, res, next) => {
  const { activeDays, currentStreak } = req.body;
  const user = req.member;

  user.lastActive = Date.now();
  user.credits = 100;
  user.currentStreak = currentStreak;
  user.daysActive = activeDays;

  await Member.findByIdAndUpdate(user._id, {
    credits: user.credits,
    lastActive: user.lastActive,
    daysActive: user.daysActive,
    currentStreak: user.currentStreak,
  });

  res.status(200).json({
    success: true,
    user,
  });
});

exports.updateLeaderboardProfileVisibility = [
  rateLimitMiddleware,
  catchAsync(async (req, res, next) => {
    const { leaderBoardProfileVisibility } = req.body;
    const user = req.member;

    user.leaderBoardProfileVisibility = leaderBoardProfileVisibility;

    await Member.findByIdAndUpdate(user._id, {
      leaderBoardProfileVisibility,
    });

    res.status(200).json({
      success: true,
      user,
    });
  }),
];

exports.updatePostTagging = [
  rateLimitMiddleware,
  catchAsync(async (req, res, next) => {
    const { tagPost } = req.body;
    const user = req.member;

    user.tagPost = tagPost;
    await Member.findByIdAndUpdate(user._id, { tagPost: user.tagPost });

    res.status(200).json({ success: true, user });
  }),
];

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const user = req.member;

  const topUsers = await Member.find(
    {},
    {
      name: 1,
      profileLink: 1,
      daysActive: 1,
      leaderBoardProfileVisibility: 1,
    }
  )
    .sort({ daysActive: -1 })
    .limit(20);

  const allUsers = await Member.find({}, { _id: 0, daysActive: 1 }).sort({
    daysActive: -1,
  });

  const userRank =
    allUsers.findIndex((u) => u.daysActive === user.daysActive) + 1;

  res.status(200).json({
    status: 'success',
    user: user,
    rank: userRank,
    users: topUsers,
  });
});

exports.createMember = catchAsync(async (req, res, next) => {
  const { name, email } = req.body;
  const organizationId = req.organization?._id;

  if (!organizationId || !req.organization) {
    return next(new AppError('Unauthorized to perform this action', 401));
  }

  if (!name || !email) {
    return next(new AppError('Name, email are required', 400));
  }

  try {
    const existingOrganization = await Organization.findById(organizationId);

    if (!existingOrganization) {
      return next(new AppError('Organization does not exist', 400));
    }

    const existingMember = await Member.findOne({ email });

    if (existingMember) {
      return next(new AppError('Member already exists with this email', 400));
    }

    let connectionToken = generateConnectionToken(organizationId);

    const newMember = new Member({
      name,
      email,
      organizationId: existingOrganization._id.toString(),
      connectionToken,
    });

    if (existingOrganization.email === email) {
      newMember.role = 'owner';
    }

    newMember.connectionToken = generateConnectionToken(
      organizationId,
      newMember._id
    );

    await sendNewMemberInviteEmail(
      existingOrganization.name,
      name,
      email,
      newMember.connectionToken
    );

    const data = await newMember.save();

    res.status(201).json({
      message: 'Member created successfully',
      data: data,
    });
  } catch (error) {
    next(new AppError('Error creating member', 500));
  }
});

exports.getAllMembersOfOrganization = catchAsync(async (req, res, next) => {
  const organizationId = req.organization._id;

  if (!organizationId) {
    return next(new AppError('Organization ID is required', 400));
  }

  try {
    const members = await Member.find({ organizationId });

    if (!members || members.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: [],
        message: 'No members found for this organization',
      });
    }

    res.status(200).json({
      status: 'success',
      data: members,
    });
  } catch (error) {
    next(new AppError('Error retrieving members', 500));
  }
});

exports.updateMemberDetails = catchAsync(async (req, res, next) => {
  const userId = req.member.id;
  const organizationId = req.member.organizationId;
  const {
    firstName,
    lastName,
    connectionsCount,
    profileViews,
    followersCount,
    followingCount,
    searchAppearances,
    completedAspects,
    stepsToCompleteProfile,
    missingAspects,
  } = req.body;

  if (!firstName || !lastName) {
    return next(new AppError('First name and last name are required', 400));
  }

  try {
    const existingOrganization = await Organization.findById(organizationId);
    if (!existingOrganization) {
      return next(new AppError('Organization not found', 404));
    }

    const existingMember = await Member.findById(userId);
    if (!existingMember || existingMember.organizationId !== organizationId) {
      return next(
        new AppError(
          'Member not found or does not belong to the organization',
          404
        )
      );
    }

    const fullName = `${firstName} ${lastName}`;

    const updatedUser = await Member.findByIdAndUpdate(
      userId,
      {
        lastSyncedAt: new Date().toLocaleString('en-GB'),
        name: fullName,
        connectionsCount,
        profileViews,
        followersCount,
        followingCount,
        searchAppearances,
        completedProfileAspects: completedAspects,
        missingProfileAspects: missingAspects,
        stepsToCompleteProfile,
      },
      {
        new: true, // Return the updated document
        runValidators: true, // Ensure validation rules are enforced
      }
    );

    if (!updatedUser) {
      return next(new AppError('User not found', 404));
    }

    // Send the response
    res.status(200).json({
      status: 'success',
      data: updatedUser,
    });
  } catch (error) {
    next(new AppError('Error updating user details', 500));
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
      return next(
        new AppError(
          'Member not found or does not belong to the organization',
          404
        )
      );
    }

    res.status(200).json({
      status: 'success',
      data: member,
    });
  } catch (error) {
    next(new AppError('Error retrieving member details', 500));
  }
});

exports.addConnectionToken = catchAsync(async (req, res, next) => {
  const { connectionToken, name, profileLink, profilePicture } = req.body;

  const organizationId = connectionToken.split('-')[0];

  const organization = await Organization.findById(organizationId);
  if (!organization) {
    return next(new AppError('Organization not found', 404));
  }
  const memberId = connectionToken.split('-')[1];
  const member = await Member.findOne({ _id: memberId, organizationId });
  if (!member) {
    return next(new AppError('Member not found', 404));
  }

  if (connectionToken !== member.connectionToken) {
    return next(new AppError('Invalid connection token', 400));
  }

  if (member.isConnected === 'connected') {
    return next(new AppError('Member already connected', 400));
  }

  member.isConnected = 'connected';
  member.name = name;
  member.profileLink = profileLink;
  member.profilePicture = profilePicture;
  const isMember = true;
  const isOrganization = false;
  await member.save();
  createSendToken(member, 200, res, isOrganization, isMember);
});

exports.disconnectLinkedIn = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId;
  const organizationId = req.organization.id;
  try {
    const member = await Member.findOne({ _id: memberId, organizationId });
    if (!member) {
      return next(
        new AppError(
          'Member not found or does not belong to the organization',
          404
        )
      );
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

exports.createMemberPersona = catchAsync(async (req, res, next) => {
  const memberId = req.params.id;
  const organizationId = req.organization.id;
  const { preferences, postSamples } = req.body;

  if (!preferences || !Array.isArray(postSamples) || postSamples.length === 0) {
    return next(
      new AppError('Preferences and sample posts are required.', 400)
    );
  }
  const member = await Member.findOne({ _id: memberId, organizationId });
  if (!member) {
    return next(new AppError('Member not found', 404));
  }

  // Call a function to analyze the persona based on preferences and sample posts
  const persona = await apiController.determinePersona(
    preferences,
    postSamples
  );
  if (!persona) {
    return next(new AppError('Failed to determine writer persona.', 500));
  }

  member.writingPersona = persona;
  await member.save();

  // Send success response
  res.status(200).json({
    status: 'success',
    message: 'Writing preferences and persona saved successfully.',
    data: {
      memberId: member._id,
      writingPersona: member.writingPersona,
    },
  });
});
