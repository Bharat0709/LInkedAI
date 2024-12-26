const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const { generateConnectionToken } = require('../utils/randomString');
const Organization = require('../models/organization');
const Member = require('../models/members');
const { sendNewMemberInviteEmail } = require('./mailController');
const rateLimitMiddleware = require('../middlewares/rateLimiter');
const { createSendToken } = require('./../middlewares/tokenUtils');

exports.verifyMemberDetails = catchAsync(async (req, res, next) => {
  const user = req.member;
  console.log(user);
  res.status(200).json({
    status: 'success',
    user: user,
  });
});

exports.checkMemberExists = catchAsync(async (req, res, next) => {
  console.log('checking if member exists');
  const { name, profileLink } = req.body;
  console.log(name, profileLink);
  const existingUser = await Member.findOne({ name, profileLink });
  console.log(existingUser);
  if (existingUser && existingUser.email) {
    createSendToken(existingUser, 200, res, false, true);
  } else {
    res.status(400).json({ success: false, message: 'Member not found' });
  }
});

exports.updateDaysActive = catchAsync(async (req, res, next) => {
  const { activeDays, currentStreak } = req.body;
  const user = req.member;

  user.lastActive = Date.now();
  user.credits = 100;
  user.currentStreak = currentStreak;

  await Member.findByIdAndUpdate(user._id, {
    credits: user.credits,
    lastActive: user.lastActive,
  });

  user.daysActive = activeDays;
  await Member.findByIdAndUpdate(user._id, {
    daysActive: user.daysActive,
    currentStreak: user.currentStreak,
  });

  res.status(200).json({ success: true, user });
});

exports.updateLeaderboardProfileVisibility = [
  rateLimitMiddleware,
  catchAsync(async (req, res, next) => {
    const { leaderBoardProfileVisibility } = req.body;
    const user = req.member;

    user.leaderBoardProfileVisibility = leaderBoardProfileVisibility;
    await Member.findByIdAndUpdate(user._id, {
      leaderBoardProfileVisibility: user.leaderBoardProfileVisibility,
    });

    res.status(200).json({ success: true, user });
  }),
];

exports.updatePostTagging = [
  rateLimitMiddleware,
  catchAsync(async (req, res, next) => {
    const { tagPost } = req.body;
    const user = req.member;

    user.tagPost = tagPost;
    await Member.findByIdAndUpdate(user._id, {
      tagPost: user.tagPost,
    });

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
    .sort({
      daysActive: -1,
    })
    .limit(20); // Limit to top 10 users

  const allUsers = await Member.find(
    {},
    {
      _id: 0,
      daysActive: 1,
    }
  ).sort({
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

exports.createMember = catchAsync(async (req, res) => {
  const { name, email } = req.body;
  console.log(name, email);
  const organizationId = req.organization._id;

  if (!name || !email || !organizationId) {
    return res
      .status(400)
      .json({ message: 'Name, email, and organization are required' });
  }

  try {
    const existingOrganization = await Organization.findById(organizationId);

    if (!existingOrganization) {
      return res.status(400).json({ message: 'Organization does not exist' });
    }
    console.log(existingOrganization);

    const existingMember = await Member.findOne({
      $or: [
        { email },
        { connectionToken: generateConnectionToken(name, organizationId) },
      ],
    });
    console.log(existingMember);

    if (existingMember) {
      return res.status(400).json({
        message: 'Member already exists with this email or connection token',
      });
    }

    const connectionToken = generateConnectionToken(name, organizationId);
    console.log(connectionToken);

    const newMember = new Member({
      name,
      email,
      organizationId: existingOrganization._id.toString(),
      connectionToken,
    });

    newMember.connectionToken = generateConnectionToken(
      existingOrganization._id.toString(),
      newMember._id.toString()
    );

    // Create new member
    if (existingOrganization.email === email) {
      newMember.role = 'owner';
    }
    console.log(newMember);
    await sendNewMemberInviteEmail(
      existingOrganization.name,
      name,
      email,
      newMember.connectionToken
    );

    const data = await newMember.save();
    console.log(data);

    res.status(201).json({
      message: 'Member created successfully',
      data: data,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Error creating member',
      error: error.message,
    });
  }
});

exports.getAllMembersOfOrganization = catchAsync(async (req, res, next) => {
  const organizationId = req.organization._id;

  if (!organizationId) {
    return res.status(400).json({ message: 'Organization ID is required' });
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
    res.status(500).json({
      message: 'Error retrieving members',
      error: error.message,
    });
  }
});

exports.updateMemberDetails = catchAsync(async (req, res, next) => {
  const userId = req.member.id;
  const organizationId = req.member.organizationId;
  console.log(userId, organizationId.toString());
  console.log(req.body);
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
    return res.status(400).json({
      message: 'First name and last name are required',
    });
  }

  try {
    const existingOrganization = await Organization.findById(organizationId);
    if (!existingOrganization) {
      return res.status(404).json({
        message: 'Organization not found',
      });
    }

    // Validate member
    const existingMember = await Member.findById(userId);
    console.log(existingMember);
    if (!existingMember || existingMember.organizationId !== organizationId) {
      return res.status(404).json({
        message: 'Member not found or does not belong to the organization',
      });
    }

    // Combine first name and last name into a full name
    const fullName = `${firstName} ${lastName}`;

    // Update the user details
    const updatedUser = await Member.findByIdAndUpdate(
      userId,
      {
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
      return res.status(404).json({
        message: 'User not found',
      });
    }

    // Send the response
    res.status(200).json({
      status: 'success',
      data: updatedUser,
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({
      message: 'Error updating user details',
      error: error.message,
    });
  }
});

exports.getMemberDetailsByIds = catchAsync(async (req, res, next) => {
  const { organizationId, memberId } = req.params;
  console.log(organizationId, memberId);
  try {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({
        message: 'Organization not found',
      });
    }

    const member = await Member.findOne({
      _id: memberId,
      organizationId,
    });

    if (!member) {
      return res.status(404).json({
        message: 'Member not found or does not belong to the organization',
      });
    }

    res.status(200).json({
      status: 'success',
      data: member,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving member details',
      error: error.message,
    });
  }
});

exports.addConnectionToken = catchAsync(async (req, res, next) => {
  const { connectionToken, name, profileLink ,  profilePicture } = req.body;
  console.log(connectionToken, name, profileLink , profilePicture);
  const organizationId = connectionToken.split('-')[0];
  console.log(organizationId);
  const organization = await Organization.findById(organizationId);
  if (!organization) {
    return res.status(404).json({
      message: 'Organization not found',
    });
  }
  const memberId = connectionToken.split('-')[1];
  console.log(memberId);
  const member = await Member.findOne({ _id: memberId, organizationId });
  if (!member) {
    return res.status(404).json({
      message: 'Member not found',
    });
  }
  console.log(connectionToken, member.connectionToken);


  if (connectionToken !== member.connectionToken) {
    return res.status(400).json({
      message: 'Invalid connection token',
    });
  }

  member.isConnected = 'connected';
  member.name = name;
  member.profileLink = profileLink;
  member.profilePicture = profilePicture;

  await member.save();
  createSendToken(member, 200, res, false, true);
});
