const HiringPost = require('../models/hiringPosts');
const Member = require('../models/members');
const Organization = require('../models/organization');
const rateLimitMiddleware = require('../middlewares/rateLimiter');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const mailController = require('./mailController');

exports.createHiringPost = [
  catchAsync(async (req, res, next) => {
    const {
      content,
      emailAddresses,
      formLinks,
      author,
      authorUrl,
      likes,
      comments,
      postUrl,
      jobRole,
    } = req.body;

    const user = req.member;
    const organizationId = user.organizationId;

    if (!organizationId || !req.member) {
      return next(new AppError('Unauthorized to perform this action', 401));
    }

    if (!content) {
      return next(new AppError('Post content is required', 400));
    }

    // Check if post with the same content and author already exists
    const existingPost = await HiringPost.findOne({
      content: content,
      author: author,
      savedBy: user._id,
    });

    if (existingPost) {
      return next(new AppError('This hiring post has already been saved', 400));
    }

    // Create a new hiring post
    const hiringPost = new HiringPost({
      content,
      emailAddresses: emailAddresses || [],
      formLinks: formLinks || [],
      author,
      authorUrl,
      likes: likes || 0,
      comments: comments || 0,
      savedBy: user._id,
      organizationId,
      postUrl: postUrl || '',
      jobRole: jobRole || '',
    });

    // Save the hiring post
    await hiringPost.save();

    res.status(201).json({
      status: 'success',
      data: hiringPost,
    });
  }),
];

exports.getHiringPosts = catchAsync(async (req, res, next) => {
  const user = req.organization;
  const organizationId = user.id;
  const {
    status,
    jobRole,
    sortBy = 'createdAt',
    order = 'desc',
    limit = 50,
    page = 1,
    search,
    memberId,
  } = req.query;

  const existingOrganization = await Organization.findById(organizationId);
  if (!existingOrganization) {
    return next(new AppError('Organization not found', 404));
  }
  let query = {
    organizationId: user.id,
  };

  // If memberId is provided and valid, use it instead of current user's ID
  if (memberId) {
    // Verify the member belongs to the same organization as the current user
    const memberExists = await Member.findOne({
      _id: memberId,
      organizationId: user.id,
    });

    if (!memberExists) {
      return next(new AppError('Member not found in your organization', 404));
    }

    query.savedBy = memberId;
  }

  // Add status filter if provided
  if (status && status !== 'all') {
    query.status = status;
  }

  // Add job role filter if provided
  if (jobRole) {
    query.jobRole = jobRole;
  }

  // Add search functionality
  if (search) {
    query.$or = [
      { content: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
      { emailAddresses: { $regex: search, $options: 'i' } },
    ];
  }

  // Set up pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Set up sorting
  let sort = {};
  sort[sortBy] = order === 'desc' ? -1 : 1;

  // Find posts with pagination
  const hiringPosts = await HiringPost.find(query)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  // Count total documents
  const totalPosts = await HiringPost.countDocuments(query);

  // Get unique job roles for filtering - use the current query
  const uniqueJobRoles = await HiringPost.distinct('jobRole', {
    ...query,
    jobRole: { $ne: '' }, // Exclude empty job roles
  });

  // Count posts by status - use the current query
  const statusCounts = await HiringPost.aggregate([
    { $match: query },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  // Format status counts for easier frontend use
  const formattedStatusCounts = {
    all: totalPosts,
    new: 0,
    contacted: 0,
    responded: 0,
    closed: 0,
    rejected: 0,
  };

  statusCounts.forEach((status) => {
    formattedStatusCounts[status._id] = status.count;
  });

  res.status(200).json({
    status: 'success',
    results: hiringPosts.length,
    totalPages: Math.ceil(totalPosts / parseInt(limit)),
    currentPage: parseInt(page),
    data: hiringPosts,
    filters: {
      jobRoles: uniqueJobRoles,
      statusCounts: formattedStatusCounts,
    },
  });
});

exports.getHiringStats = catchAsync(async (req, res, next) => {
  const user = req.organization;
  const organizationId = user.id;
  const { timeframe = 'month', memberId } = req.query;

  const existingOrganization = await Organization.findById(organizationId);
  if (!existingOrganization) {
    return next(new AppError('Organization not found', 404));
  }
  let dateFilter = {};

  const now = new Date();

  // Set date filter based on timeframe
  if (timeframe === 'week') {
    const lastWeek = new Date(now);
    lastWeek.setDate(now.getDate() - 7);
    dateFilter = { createdAt: { $gte: lastWeek } };
  } else if (timeframe === 'month') {
    const lastMonth = new Date(now);
    lastMonth.setMonth(now.getMonth() - 1);
    dateFilter = { createdAt: { $gte: lastMonth } };
  } else if (timeframe === 'year') {
    const lastYear = new Date(now);
    lastYear.setFullYear(now.getFullYear() - 1);
    dateFilter = { createdAt: { $gte: lastYear } };
  }

  // Build base query with organization ID
  let userQuery = {
    organizationId: user.id,
    ...dateFilter,
  };

  // If memberId is provided, add it to the query
  if (memberId) {
    // Verify the member belongs to the same organization as the current user
    const memberExists = await Member.findOne({
      _id: memberId,
      organizationId: user.id,
    });

    if (!memberExists) {
      return next(new AppError('Member not found in your organization', 404));
    }

    // Add savedBy filter with the member ID
    userQuery.savedBy = memberId;
  }

  // First, check if there are any posts that match the query
  const postsExist = await HiringPost.countDocuments(userQuery);

  // ALTERNATIVE APPROACH: Get posts and count statuses directly
  const posts = await HiringPost.find(userQuery, { status: 1 });

  // Manual count of statuses
  const statusMap = {
    new: 0,
    contacted: 0,
    responded: 0,
    closed: 0,
    rejected: 0,
  };

  // Count each status
  posts.forEach((post) => {
    const status = post.status || 'new'; // Default to 'new' if status is undefined
    if (statusMap[status] !== undefined) {
      statusMap[status]++;
    }
  });

  // Count by status using aggregation as a fallback
  const userStatusCounts = await HiringPost.aggregate([
    { $match: userQuery },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  // Format status counts
  const formattedUserStatusCounts = {
    new: statusMap.new || 0,
    contacted: statusMap.contacted || 0,
    responded: statusMap.responded || 0,
    closed: statusMap.closed || 0,
    rejected: statusMap.rejected || 0,
  };

  // Use aggregation results if they exist
  if (userStatusCounts && userStatusCounts.length > 0) {
    userStatusCounts.forEach((status) => {
      if (status._id && formattedUserStatusCounts[status._id] !== undefined) {
        formattedUserStatusCounts[status._id] = status.count;
      }
    });
  }

  // Get total user posts
  const totalUserPosts = postsExist; // Use the count we already have

  res.status(200).json({
    status: 'success',
    data: {
      userStats: {
        statusCounts: formattedUserStatusCounts,
        totalPosts: totalUserPosts,
      },
    },
  });
});

exports.getOrganizationHiringPosts = catchAsync(async (req, res, next) => {
  const { organizationId } = req.params;
  const user = req.member;

  // Ensure user belongs to this organization or is admin
  if (
    user.organizationId.toString() !== organizationId &&
    !['admin', 'owner'].includes(user.role)
  ) {
    return next(
      new AppError('You do not have permission to access these posts', 403)
    );
  }

  const {
    status,
    jobRole,
    memberId, // Use consistent parameter name
    sortBy = 'createdAt',
    order = 'desc',
    limit = 10,
    page = 1,
    search,
  } = req.query;

  // Build query
  let query = {
    organizationId,
  };

  // Add status filter if provided
  if (status && status !== 'all') {
    query.status = status;
  }

  // Add job role filter if provided
  if (jobRole) {
    query.jobRole = jobRole;
  }

  // Add member filter if provided
  if (memberId) {
    // Verify the member belongs to the organization
    const memberExists = await Member.findOne({
      _id: memberId,
      organizationId,
    });

    if (!memberExists) {
      return next(new AppError('Member not found in this organization', 404));
    }

    query.savedBy = memberId;
  }

  // Add search functionality
  if (search) {
    query.$or = [
      { content: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
      { emailAddresses: { $regex: search, $options: 'i' } },
    ];
  }

  // Set up pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Set up sorting
  let sort = {};
  sort[sortBy] = order === 'desc' ? -1 : 1;

  // Find posts with pagination and populate the savedBy field
  const hiringPosts = await HiringPost.find(query)
    .populate('savedBy', 'name profilePicture')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  // Count total documents
  const totalPosts = await HiringPost.countDocuments(query);

  res.status(200).json({
    status: 'success',
    results: hiringPosts.length,
    totalPages: Math.ceil(totalPosts / parseInt(limit)),
    currentPage: parseInt(page),
    data: hiringPosts,
  });
});

exports.getHiringPost = catchAsync(async (req, res, next) => {
  const postId = req.params.id;
  const user = req.member;

  const hiringPost = await HiringPost.findById(postId).populate(
    'savedBy',
    'name profilePicture email'
  );

  if (!hiringPost) {
    return next(new AppError('Hiring post not found', 404));
  }

  // Check if the post belongs to the user or their organization (if admin/owner)
  const canAccess =
    hiringPost.savedBy._id.toString() === user._id.toString() ||
    (hiringPost.organizationId.toString() === user.organizationId.toString() &&
      ['admin', 'owner'].includes(user.role));

  if (!canAccess) {
    return next(
      new AppError('You do not have permission to view this post', 403)
    );
  }

  res.status(200).json({
    status: 'success',
    data: hiringPost,
  });
});

exports.updateHiringPostStatus = [
  catchAsync(async (req, res, next) => {
    const postId = req.params.id;
    const { status } = req.body;

    if (
      !['new', 'contacted', 'responded', 'closed', 'rejected'].includes(status)
    ) {
      return next(new AppError('Invalid status value', 400));
    }

    const hiringPost = await HiringPost.findById(postId);

    if (!hiringPost) {
      return next(new AppError('Hiring post not found', 404));
    }

    // Update the status
    hiringPost.status = status;
    hiringPost.updatedAt = Date.now();
    await hiringPost.save();

    res.status(200).json({
      status: 'success',
      data: hiringPost,
    });
  }),
];

exports.updateHiringPostNotes = [
  catchAsync(async (req, res, next) => {
    const postId = req.params.id;
    const { notes } = req.body;
    const user = req.organization;

    const hiringPost = await HiringPost.findById(postId);

    if (!hiringPost) {
      return next(new AppError('Hiring post not found', 404));
    }

    // Update the notes
    hiringPost.notes = notes;
    hiringPost.updatedAt = Date.now();
    await hiringPost.save();

    res.status(200).json({
      status: 'success',
      data: hiringPost,
    });
  }),
];

exports.updateJobRole = [
  catchAsync(async (req, res, next) => {
    const postId = req.params.id;
    const { jobRole } = req.body;
    const user = req.organization;

    if (!jobRole) {
      return next(new AppError('Job role is required', 400));
    }

    const hiringPost = await HiringPost.findById(postId);

    if (!hiringPost) {
      return next(new AppError('Hiring post not found', 404));
    }

    // Update the job role
    hiringPost.jobRole = jobRole;
    hiringPost.updatedAt = Date.now();
    await hiringPost.save();

    res.status(200).json({
      status: 'success',
      data: hiringPost,
    });
  }),
];

exports.updateCandidateRequirements = [
  rateLimitMiddleware,
  catchAsync(async (req, res, next) => {
    const postId = req.params.id;
    const { candidateRequirements } = req.body;
    const user = req.member;

    if (!Array.isArray(candidateRequirements)) {
      return next(new AppError('Candidate requirements must be an array', 400));
    }

    const hiringPost = await HiringPost.findById(postId);

    if (!hiringPost) {
      return next(new AppError('Hiring post not found', 404));
    }

    // Check if the post belongs to the user or their organization (if admin/owner)
    const canUpdate =
      hiringPost.savedBy.toString() === user._id.toString() ||
      (hiringPost.organizationId.toString() ===
        user.organizationId.toString() &&
        ['admin', 'owner'].includes(user.role));

    if (!canUpdate) {
      return next(
        new AppError('You do not have permission to update this post', 403)
      );
    }

    // Update candidate requirements
    hiringPost.candidateRequirements = candidateRequirements;
    hiringPost.updatedAt = Date.now();
    await hiringPost.save();

    res.status(200).json({
      status: 'success',
      data: hiringPost,
    });
  }),
];

exports.deleteHiringPost = catchAsync(async (req, res, next) => {
  const postId = req.params.id;
  const user = req.organization;

  const hiringPost = await HiringPost.findById(postId);

  if (!hiringPost) {
    return next(new AppError('Hiring post not found', 404));
  }

  await HiringPost.findByIdAndDelete(postId);

  res.status(204).send();
});

exports.contactHiringPost = [
  rateLimitMiddleware,
  catchAsync(async (req, res, next) => {
    const postId = req.params.id;
    const { emailContent } = req.body;
    const user = req.member;

    if (!emailContent) {
      return next(new AppError('Email content is required', 400));
    }

    const hiringPost = await HiringPost.findById(postId);

    if (!hiringPost) {
      return next(new AppError('Hiring post not found', 404));
    }

    // Check if the post belongs to the user or their organization (if admin/owner)
    const canContact =
      hiringPost.savedBy.toString() === user._id.toString() ||
      (hiringPost.organizationId.toString() ===
        user.organizationId.toString() &&
        ['admin', 'owner'].includes(user.role));

    if (!canContact) {
      return next(
        new AppError('You do not have permission to contact for this post', 403)
      );
    }

    // Check if there's at least one email address
    if (!hiringPost.emailAddresses || hiringPost.emailAddresses.length === 0) {
      return next(new AppError('No email addresses found to contact', 400));
    }

    try {
      // Send email
      await mailController.sendHiringResponse(
        hiringPost.emailAddresses[0],
        user.email,
        emailContent,
        hiringPost.content
      );

      // Update post status to contacted
      hiringPost.status = 'contacted';
      hiringPost.updatedAt = Date.now();
      await hiringPost.save();

      res.status(200).json({
        status: 'success',
        message: 'Contact email sent successfully',
        data: hiringPost,
      });
    } catch (error) {
      return next(new AppError('Failed to send contact email', 500));
    }
  }),
];

exports.bulkUpdateHiringPosts = [
  rateLimitMiddleware,
  catchAsync(async (req, res, next) => {
    const { postIds, status } = req.body;
    const user = req.member;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return next(new AppError('Post IDs are required', 400));
    }

    if (
      !status ||
      !['new', 'contacted', 'responded', 'closed', 'rejected'].includes(status)
    ) {
      return next(new AppError('Valid status is required', 400));
    }

    // Verify post ownership
    const posts = await HiringPost.find({ _id: { $in: postIds } });

    // Check if all posts belong to user or organization (if admin/owner)
    const hasPermission = posts.every(
      (post) =>
        post.savedBy.toString() === user._id.toString() ||
        (post.organizationId.toString() === user.organizationId.toString() &&
          ['admin', 'owner'].includes(user.role))
    );

    if (!hasPermission) {
      return next(
        new AppError(
          'You do not have permission to update some of these posts',
          403
        )
      );
    }

    // Update all posts
    await HiringPost.updateMany(
      { _id: { $in: postIds } },
      { $set: { status, updatedAt: Date.now() } }
    );

    res.status(200).json({
      status: 'success',
      message: `${postIds.length} posts updated successfully`,
    });
  }),
];

exports.exportHiringPosts = catchAsync(async (req, res, next) => {
  const user = req.member;
  const { status, timeframe, memberId } = req.query;

  // Build query
  let query = {
    organizationId: user.organizationId,
  };

  // Filter by member if provided
  if (memberId) {
    // Verify the member belongs to the same organization
    const memberExists = await Member.findOne({
      _id: memberId,
      organizationId: user.organizationId,
    });

    if (!memberExists) {
      return next(new AppError('Member not found in your organization', 404));
    }

    query.savedBy = memberId;
  } else {
    // Default to current user if no member specified
    query.savedBy = user._id;
  }

  // Add status filter if provided
  if (status && status !== 'all') {
    query.status = status;
  }

  // Add timeframe filter if provided
  if (timeframe) {
    const now = new Date();
    let startDate;

    if (timeframe === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (timeframe === 'month') {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    } else if (timeframe === 'year') {
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
    }

    if (startDate) {
      query.createdAt = { $gte: startDate };
    }
  }

  // Find all posts matching the query
  const hiringPosts = await HiringPost.find(query).sort({ createdAt: -1 });

  if (hiringPosts.length === 0) {
    return next(new AppError('No posts found to export', 404));
  }

  // Format data for CSV
  const csvData = hiringPosts.map((post) => ({
    Author: post.author,
    'Author URL': post.authorUrl,
    Content: post.content.replace(/,/g, ' ').replace(/\n/g, ' '), // Remove commas and newlines
    'Email Addresses': post.emailAddresses.join('; '),
    'Form Links': post.formLinks.join('; '),
    'Job Role': post.jobRole,
    Status: post.status,
    Likes: post.likes,
    Comments: post.comments,
    'Date Saved': post.createdAt.toISOString().split('T')[0],
    Notes: post.notes ? post.notes.replace(/,/g, ' ').replace(/\n/g, ' ') : '',
  }));

  // Create CSV headers
  const headers = Object.keys(csvData[0]).join(',');

  // Create CSV rows
  const rows = csvData.map((row) => Object.values(row).join(','));

  // Combine headers and rows
  const csv = [headers, ...rows].join('\n');

  // Set headers for file download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="hiring-posts-${
      new Date().toISOString().split('T')[0]
    }.csv"`
  );

  res.status(200).send(csv);
});

exports.detectJobRole = [
  rateLimitMiddleware,
  catchAsync(async (req, res, next) => {
    const postId = req.params.id;
    const user = req.organization;

    const hiringPost = await HiringPost.findById(postId);

    if (!hiringPost) {
      return next(new AppError('Hiring post not found', 404));
    }

    // Check if the post belongs to the user or their organization (if admin/owner)
    const canUpdate =
      hiringPost.savedBy.toString() === user._id.toString() ||
      (hiringPost.organizationId.toString() ===
        user.organizationId.toString() &&
        ['admin', 'owner'].includes(user.role));

    if (!canUpdate) {
      return next(
        new AppError('You do not have permission to update this post', 403)
      );
    }

    try {
      // Call API controller to detect job role from content
      // This would use your existing apiController or similar
      const detectedRole = await apiController.detectJobRole(
        hiringPost.content
      );

      if (detectedRole) {
        hiringPost.jobRole = detectedRole;
        hiringPost.updatedAt = Date.now();
        await hiringPost.save();
      }

      res.status(200).json({
        status: 'success',
        data: {
          jobRole: hiringPost.jobRole,
        },
      });
    } catch (error) {
      return next(new AppError('Failed to detect job role', 500));
    }
  }),
];

exports.getJobRoleSuggestions = catchAsync(async (req, res, next) => {
  const user = req.member;
  const { memberId } = req.query;

  // Build query for specific member or organization-wide
  let query = {
    organizationId: user.organizationId,
    jobRole: { $ne: '' }, // Exclude empty job roles
  };

  // If memberId is provided, filter by that member
  if (memberId) {
    // Verify the member belongs to the same organization
    const memberExists = await Member.findOne({
      _id: memberId,
      organizationId: user.organizationId,
    });

    if (!memberExists) {
      return next(new AppError('Member not found in your organization', 404));
    }

    query.savedBy = memberId;
  }

  // Get all unique job roles from the query
  const jobRoles = await HiringPost.distinct('jobRole', query);

  // Add some common job roles if the list is small
  const commonJobRoles = [
    'Software Engineer',
    'Product Manager',
    'Data Scientist',
    'Marketing Specialist',
    'Sales Representative',
    'UX Designer',
    'Customer Success Manager',
    'Financial Analyst',
    'HR Manager',
    'Content Writer',
  ];

  // Combine and deduplicate
  let allJobRoles = [...new Set([...jobRoles, ...commonJobRoles])];

  // Sort alphabetically
  allJobRoles.sort();

  res.status(200).json({
    status: 'success',
    data: allJobRoles,
  });
});

exports.getMembersWithHiringPosts = catchAsync(async (req, res, next) => {
  const user = req.member;
  const { timeframe = 'all' } = req.query;

  // Build date filter based on timeframe
  let dateFilter = {};
  const now = new Date();

  if (timeframe === 'week') {
    const lastWeek = new Date(now);
    lastWeek.setDate(now.getDate() - 7);
    dateFilter = { createdAt: { $gte: lastWeek } };
  } else if (timeframe === 'month') {
    const lastMonth = new Date(now);
    lastMonth.setMonth(now.getMonth() - 1);
    dateFilter = { createdAt: { $gte: lastMonth } };
  } else if (timeframe === 'year') {
    const lastYear = new Date(now);
    lastYear.setFullYear(now.getFullYear() - 1);
    dateFilter = { createdAt: { $gte: lastYear } };
  }

  // Build base query with organization and date filter
  const baseQuery = {
    organizationId: user.organizationId,
    ...dateFilter,
  };

  // Get count of hiring posts by member
  const memberCounts = await HiringPost.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: '$savedBy',
        count: { $sum: 1 },
        new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
        contacted: {
          $sum: { $cond: [{ $eq: ['$status', 'contacted'] }, 1, 0] },
        },
        responded: {
          $sum: { $cond: [{ $eq: ['$status', 'responded'] }, 1, 0] },
        },
        closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // Get all members for the organization
  const allMembers = await Member.find(
    { organizationId: user.organizationId },
    { _id: 1, name: 1, profilePicture: 1, email: 1 }
  );

  // Combine member info with post counts
  const memberStats = allMembers.map((member) => {
    const memberCount = memberCounts.find(
      (item) => item._id && item._id.toString() === member._id.toString()
    );

    return {
      memberId: member._id,
      name: member.name,
      email: member.email,
      profilePicture: member.profilePicture,
      totalPosts: memberCount ? memberCount.count : 0,
      statusCounts: memberCount
        ? {
            new: memberCount.new || 0,
            contacted: memberCount.contacted || 0,
            responded: memberCount.responded || 0,
            closed: memberCount.closed || 0,
            rejected: memberCount.rejected || 0,
          }
        : {
            new: 0,
            contacted: 0,
            responded: 0,
            closed: 0,
            rejected: 0,
          },
    };
  });

  // Sort by total posts (highest first)
  memberStats.sort((a, b) => b.totalPosts - a.totalPosts);

  res.status(200).json({
    status: 'success',
    data: memberStats,
  });
});
