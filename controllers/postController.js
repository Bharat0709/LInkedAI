// controllers/postController.js
const catchAsync = require('../utils/catchAsync');
const postService = require('../services/Post/postService');

exports.upsertPostsData = catchAsync(async (req, res, next) => {
  const organizationId = req.member.organizationId;
  const memberId = req.member._id;
  const posts = req.body;
  const result = await postService.upsertPostsData(memberId, organizationId, posts);

  res.status(200).json(result);
});

exports.getPostsByMemberAndOrganization = catchAsync(async (req, res, next) => {
  const organizationId = req.organization.id;
  const memberId = req.params.id;

  const result = await postService.getPostsByMemberAndOrganization(memberId, organizationId);

  res.status(200).json(result);
});
