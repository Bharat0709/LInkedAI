// controllers/postController.js
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Post = require('../models/posts');
const Organization = require('../models/organization');
const Member = require('../models/members');

exports.upsertPostsData = catchAsync(async (req, res, next) => {
  const organizationId = req.member.organizationId;
  const memberId = req.member.id;
  const posts = req.body;

  if (!Array.isArray(posts) || posts.length === 0) {
    return res.status(400).json({
      message: 'Posts data must be a non-empty array',
    });
  }

  try {
    const existingOrganization = await Organization.findById(organizationId);
    if (!existingOrganization) {
      return next(new AppError('Organization not found', 404));
    }

    const existingMember = await Member.findById(memberId);
    if (!existingMember) {
      return next(new AppError('Member not found', 404));
    }

    const memberName = existingMember.name;
    const filteredPosts = posts.filter((post) => post.author === memberName);

    if (filteredPosts.length === 0) {
      return res.status(400).json({
        message: 'No posts match the member name',
      });
    }

    const processedPosts = [];

    for (const post of filteredPosts) {
      const {
        postUrn,
        postedAround,
        author,
        shareUrl,
        numLikes,
        numShares,
        numViews,
        numImpressions,
        numComments,
        textContent,
      } = post;

      if (!postUrn) {
        return res.status(400).json({
          message: 'Each post must have a valid postUrn',
        });
      }

      let existingPost = await Post.findOne({
        postUrn,
        organizationId,
        memberId,
      });

      if (existingPost) {
        existingPost = await Post.findOneAndUpdate(
          { postUrn, organizationId },
          {
            postedAround,
            author: {
              name: author,
              profilePicture: req.member.profilePicture,
            },
            shareUrl,
            numLikes,
            numShares,
            numViews,
            numImpressions,
            numComments,
            textContent,
          },
          { new: true, runValidators: true }
        );
      } else {
        existingPost = await Post.create({
          organizationId: organizationId,
          memberId: memberId,
          author: {
            name: author,
            profilePicture: req.member.profilePicture,
          },
          postUrn,
          postedAround,
          shareUrl,
          numLikes,
          numShares,
          numViews,
          numImpressions,
          numComments,
          textContent,
        });
      }
      processedPosts.push(existingPost);
    }

    res.status(200).json({
      status: 'success',
    });
  } catch (error) {
    next(new AppError('Error processing posts data', 500));
  }
});

exports.getPostsByMemberAndOrganization = catchAsync(async (req, res, next) => {
  const organizationId = req.organization.id;
  const memberId = req.params.id;

  try {
    const existingOrganization = await Organization.findById(organizationId);
    if (!existingOrganization) {
      return next(new AppError('Organization not found', 404));
    }

    const existingMember = await Member.findById(memberId);
    if (!existingMember) {
      return next(new AppError('Member not found', 404));
    }

    const posts = await Post.find({
      organizationId,
      memberId,
    });

    if (!posts || posts.length === 0) {
      return res.status(200).json({
        message: 'No posts found for this member and organization',
        posts: [],
        stats: {
          topPosts: [],
          totalImpressions: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          totalViews: 0,
        },
      });
    }

    // Calculate statistics
    const totalImpressions = posts.reduce(
      (sum, post) => sum + post.numImpressions,
      0
    );
    const totalLikes = posts.reduce((sum, post) => sum + post.numLikes, 0);
    const totalComments = posts.reduce(
      (sum, post) => sum + post.numComments,
      0
    );
    const totalShares = posts.reduce((sum, post) => sum + post.numShares, 0);
    const totalViews = posts.reduce((sum, post) => sum + post.numViews, 0);

    const topPosts = posts
      .sort((a, b) => b.numImpressions - a.numImpressions)
      .slice(0, 5);

    res.status(200).json({
      message: 'Success',
      posts,
      topPosts,
      stats: {
        totalImpressions,
        totalLikes,
        totalComments,
        totalShares,
        totalViews,
      },
    });
  } catch (error) {
    next(new AppError('Error fetching posts', 500));
  }
});
