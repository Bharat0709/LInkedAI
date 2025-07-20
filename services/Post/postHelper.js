const memberRepository = require('../../repositories/memberRepository');
const organizationRepository = require('../../repositories/organizationRepository');

const validatePostData = post => {
  const requiredFields = ['postUrn'];
  const missingFields = requiredFields.filter(field => !post[field]);

  if (missingFields.length > 0) {
    throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400);
  }
};

const validateMemberAndOrganization = async (memberId, organizationId) => {
  const [organization, member] = await Promise.all([organizationRepository.findById(organizationId), memberRepository.findById(memberId)]);

  if (!organization) {
    throw new AppError('Organization not found', 404);
  }

  if (!member) {
    throw new AppError('Member not found', 404);
  }

  return member;
};

const processPostData = (post, member) => {
  const { postUrn, postedAround, author, shareUrl, numLikes = 0, numShares = 0, numViews = 0, numImpressions = 0, numComments = 0, textContent } = post;

  return {
    postUrn,
    postedAround,
    author: {
      name: author,
      profilePicture: member.profilePicture,
    },
    shareUrl,
    numLikes,
    numShares,
    numViews,
    numImpressions,
    numComments,
    textContent,
  };
};

module.exports = {
  validatePostData,
  validateMemberAndOrganization,
  processPostData,
};
